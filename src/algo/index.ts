import { askAI } from "../ai";
import { placeOrder, type OrderRequest, getNetPositions, getAllOrders, ORDER_STATUS } from "../broker/fyers";
import { logger } from "../logger";
import { downloadOptionContracts, findContract } from "../optionContracts";
import { sendMessageToChannel } from "../telegram/bot";
import cache, { getKey } from "../utils/cache";
import getAccessToken from "../utils/login";
const { MYSTIC_CHANNEL_ID, TRADE_QTY } = process.env

const completedOrderStatus = [ORDER_STATUS.Pending, ORDER_STATUS.TradedOrFilled, ORDER_STATUS.Transit]

export default async function runAlgo() {
  // process message with AI LLM
  const key = getKey(MYSTIC_CHANNEL_ID!);
  let message = await cache.lrange(key, 0, -1)
  let messageStr = message.join('\n')

  const aiResponse = await askAI(messageStr);
  logger.info({ aiResponse }, "response from ai");
  if (!aiResponse) {
    logger.info('NO TRADE')
    return
  }

  // find all bank nifty contracts
  const optionsContracts = await downloadOptionContracts();

  // find the appropriate contract
  const contract = findContract(optionsContracts, aiResponse?.strike, aiResponse?.type);

  if (!contract) {
    logger.info("no contract found!");
    return;
  }
  logger.info({ contract }, "contract found!")
  // check any running position, pending orders, completed orders
  const token = await getAccessToken();
  const positionRes = await getNetPositions(token);
  logger.info({ positionRes }, "positions")

  if (positionRes.overall.count_total > 0) {
    logger.info('Today position already there, so skipping.. ');
    return;
  }

  const ordersRes = await getAllOrders(token);

  const isOrderForTodayAlreadyDone = ordersRes.orderBook.some((order: any) => completedOrderStatus.includes(order.status))
  if (isOrderForTodayAlreadyDone) {
    logger.info("No more trades to execute for today!");
    return
  }

  // if not, then create a new order with 30 point SL, and 50 point target.
  const orderRequest: OrderRequest = {
    symbol: contract.symbol,
    qty: TRADE_QTY ? Number(TRADE_QTY) : 0,
    limitPrice: aiResponse.ltp + 1,
    stopPrice: aiResponse.ltp,
    stopLoss: 31,
    takeProfit: 55

  }
  const res = await placeOrder(token, orderRequest);
  logger.info({ orderRes: res }, "Order placed")

  await sendMessageToChannel(`Trade Execution ${res.s !== "error" ? "Success" : "Failed"}:
  ${aiResponse.indexName} ${aiResponse.strike} ${aiResponse.type} above ${aiResponse.ltp} `)


}