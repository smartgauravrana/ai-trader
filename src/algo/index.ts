import { askAI } from "../ai";
import { placeOrder, type OrderRequest, getNetPositions } from "../broker/fyers";
import { downloadOptionContracts, findContract } from "../optionContracts";
import { sendMessageToChannel } from "../telegram/bot";
import cache, { getKey } from "../utils/cache";
import getAccessToken from "../utils/login";
const { MYSTIC_CHANNEL_ID, TRADE_QTY } = process.env

export default async function runAlgo() {
  // process message with AI LLM
  const key = getKey(MYSTIC_CHANNEL_ID!);
  let message = await cache.lrange(key, 0, -1)
  let messageStr = message.join('\n')

  const aiResponse = await askAI(messageStr);
  console.log(aiResponse);
  if (!aiResponse) {
    console.log('NO TRADE')
    return
  }

  // find all bank nifty contracts
  const optionsContracts = await downloadOptionContracts();

  // find the appropriate contract
  const contract = findContract(optionsContracts, aiResponse?.strike, aiResponse?.type);

  if (!contract) {
    console.log("no contract found!");
    return;
  }
  // check any running position, pending orders, completed orders
  const token = await getAccessToken();
  const positionRes = await getNetPositions(token);
  console.log("positions: ", positionRes)

  if (positionRes.overall.count_total > 0) {
    console.log('Today position already there, so skipping.. ');
    return;
  }

  // if not, then create a new order with 30 point SL, and 50 point target.
  const orderRequest: OrderRequest = {
    symbol: contract.symbol,
    qty: TRADE_QTY ? Number(TRADE_QTY) : 0,
    limitPrice: aiResponse.ltp + 1,
    stopPrice: aiResponse.ltp,
    stopLoss: aiResponse.ltp - 30,
    takeProfit: aiResponse.ltp + 51

  }
  const res = await placeOrder(token, orderRequest);
  console.log("Order placed: ", res)

  await sendMessageToChannel(`Trade Execution ${res.s !== "error" ? "Success" : "Failed"}:
  ${aiResponse.indexName} ${aiResponse.strike} ${aiResponse.type} above ${aiResponse.ltp} `)


}