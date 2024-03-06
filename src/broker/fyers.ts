import { LOT_SIZE } from "../constants";

export type OrderRequest = {
  symbol: string;
  qty: number;
  limitPrice: number;
  stopPrice: number;
  stopLoss: number;
  takeProfit: number;
};

export enum ORDER_STATUS {
  Canceled = 1,
  TradedOrFilled = 2,
  NotUsedCurrently = 3,
  Transit = 4,
  Rejected = 5,
  Pending = 6,
  Expired = 7,
}

export interface FyersApiResponse<T> {
  code: number;
  message: string;
  s: string;
  [key: string]: T | number | string;
}

interface FundLimitResponse extends FyersApiResponse<FyersFundDetails[]> {
  fund_limit: FyersFundDetails[];
}

export type FyersFundDetails = {
  id: number;
  title: string;
  equityAmount: number;
  commodityAmount: number;
};

export function placeOrder(
  fyers: any,
  createOrderReq: OrderRequest
): Promise<any> {
  const { symbol, qty, limitPrice, stopLoss, takeProfit, stopPrice } =
    createOrderReq;

  const orders = [];
  const totalLots = qty / LOT_SIZE;
  const bracketOrderLots = totalLots === 1 ? 1 : Math.floor(totalLots / 2);
  const coverOrderLots = totalLots - bracketOrderLots;

  const bracketOrder = {
    symbol,
    // qty: bracketOrderLots * LOT_SIZE,// TODO
    qty: totalLots * LOT_SIZE,
    type: 4,
    side: 1, // buy
    productType: "BO",
    limitPrice,
    stopPrice,
    disclosedQty: 0,
    validity: "DAY",
    offlineOrder: false,
    stopLoss,
    takeProfit,
  };
  orders.push(bracketOrder);

  // if (coverOrderLots > 0) {
  //   // create CO order as well
  //   const coverOrder = {
  //     symbol,
  //     qty: coverOrderLots * LOT_SIZE,
  //     type: 4,
  //     side: 1, // buy
  //     productType: "CO",
  //     limitPrice,
  //     stopPrice,
  //     disclosedQty: 0,
  //     validity: "DAY",
  //     offlineOrder: false,
  //     stopLoss: 30,
  //   };
  //   orders.push(coverOrder);
  // }

  // add logic if lot size more than 1
  // const reqBody = {
  //   symbol,
  //   qty,
  //   type: 4,
  //   side: 1, // buy
  //   productType: "BO",
  //   limitPrice,
  //   stopPrice,
  //   disclosedQty: 0,
  //   validity: "DAY",
  //   offlineOrder: false,
  //   stopLoss,
  //   takeProfit,
  // };
  return Promise.allSettled(
    orders.map((orderReq) => fyers.place_order(orderReq))
  );
}

export function getNetPositions(fyers: any): Promise<any> {
  return fyers.get_positions();
}

export function getFundsDetails(fyers: any): Promise<FundLimitResponse> {
  return fyers.get_funds();
}

export function getAllOrders(fyers: any): Promise<any> {
  return fyers.get_orders();
}

// fyers.get_profile().then((response) => {
//   console.log(response)
// }).catch((err) => {
//   console.log(err)
// })

// fyers.getQuotes(["NSE:SBIN-EQ", "NSE:TCS-EQ"]).then((response) => {
//   console.log(response)
// }).catch((err) => {
//   console.log(err)
// })

// fyers.getMarketDepth({ "symbol": ["NSE:SBIN-EQ", "NSE:TCS-EQ"], "ohlcv_flag": 1 }).then((response) => {
//   console.log(response)
// }).catch((err) => {
//   console.log(err)
// })
