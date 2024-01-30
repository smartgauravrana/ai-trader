import fetch from 'node-fetch';
import { parse as csvParse } from 'csv-parse';
import client from '../utils/cache';
import { logger } from '../logger';

export type Contract = {
  name: string;
  lot: number;
  tick: number;
  tradingSession: string;
  lastUpdateDate: string;
  expiryTs: number;
  symbol: string;
  scripName: string;
  strikePrice: number;
  optionType: string;
}

async function downloadAndParseCSV(url: string, header: string): Promise<any[]> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download file. HTTP status ${response.status}`);
  }
  const csvString = await response.text();
  const csvData = `${header}\n${csvString}`;
  return new Promise<any[]>((resolve, reject) => {
    csvParse(csvData, {
      columns: true,
      skip_empty_lines: true
    }, (err, records) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(records);
    });
  });
}

export async function downloadOptionContracts(): Promise<Contract[]> {
  let data = await client.lrange('option_chain', 0, -1);
  if (data.length) {
    logger.info('CSV file from cache, header added, and parsed successfully.');
    const res: Contract[] = data.map(item => JSON.parse(item));
    return res;
  }
  const url = 'https://public.fyers.in/sym_details/NSE_FO.csv';
  const header = 'FyersToken,Name,Instrument,lot,tick,ISIN,TradingSession,Lastupdatedate,Expirydate,Symbol,Exchange,Segment,ScripCode,ScripName,EXTRA1,StrikePrice,OptionType,FYTOKEN1,EXTRA2'; // Modify this with your header

  try {
    let records = await downloadAndParseCSV(url, header);
    const result: Contract[] = records.filter(item => item.Instrument == "14" && item.ScripName === "BANKNIFTY").map(item => ({
      name: item.Name,
      lot: Number(item.lot),
      tick: Number(item.tick),
      tradingSession: item.TradingSession,
      lastUpdateDate: item.Lastupdatedate,
      expiryTs: Number(item.Expirydate) * 1000,
      symbol: item.Symbol,
      scripName: item.ScripName,
      strikePrice: Number(item.StrikePrice),
      optionType: item.OptionType,

    }))
    logger.info('CSV file downloaded, header added, and parsed successfully.');


    await client.rpush("option_chain", ...result.map(item => JSON.stringify(item)))

    return result
  } catch (error) {
    console.error('An error occurred:', error);
    return []
  }
}

export function findContract(contractList: any, strikePrice: number, optionType: string): Contract | null {
  const filteredList = contractList.filter((item: any) => item.strikePrice === strikePrice && item.optionType === optionType);
  const sortedList = filteredList.sort((a: any, b: any) => a.expiryTs - b.expiryTs);
  const now = new Date(); // Current date and time in local time
  const utcNow = new Date(now.getTime() + now.getTimezoneOffset() * 60000); // Convert to UTC

  let result = null;

  for (let i = 0; i < sortedList.length; i++) {
    const contract = sortedList[i];
    const expiry = new Date(contract.expiryTs);
    const expiryUtc = new Date(expiry.getTime() + expiry.getTimezoneOffset() * 60000);

    if (utcNow < expiryUtc) {
      // foun contract
      result = contract;
      break;
    }
  }
  return result
}


