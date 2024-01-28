import { askAI } from "../ai";
import { placeOrder, type OrderRequest } from "../broker/fyers";
import { downloadOptionContracts, findContract } from "../optionContracts";
import cache, { getKey } from "../utils/cache";
import getAccessToken from "../utils/login";
const { MYSTIC_CHANNEL_ID } = process.env

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

  // if not, then create a new order with 30 point SL, and 50 point target.

  const token = await getAccessToken();
  const orderRequest: OrderRequest = {
    symbol: contract.symbol,
    qty: 15,
    limitPrice: aiResponse.ltp + 1,
    stopPrice: aiResponse.ltp,
    stopLoss: aiResponse.ltp - 30,
    takeProfit: aiResponse.ltp + 51

  }
  const res = await placeOrder(token, orderRequest);
  console.log("Order placed: ", res)


}