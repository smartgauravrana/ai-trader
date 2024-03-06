import { PromisePool } from "@supercharge/promise-pool";
import type { Contract } from "../optionContracts";
import { User, UserModel } from "../models/User";
import {
  getAllOrders,
  getNetPositions,
  placeOrder,
  type OrderRequest,
  ORDER_STATUS,
  getFundsDetails,
} from "../broker/fyers";
import { logger } from "../logger";
import type { AIResponse } from "../ai";
import { sendMessageToChannel } from "../telegram/bot";
import {
  AVAILABLE_BALANCE_ID,
  DEFAULT_SL,
  LOT_SIZE,
  TAKE_PROFIT,
} from "../constants";
import memCache from "../utils/mem-cache";

const { REDIRECT_URL } = process.env;
const completedOrderStatus = [
  ORDER_STATUS.Pending,
  ORDER_STATUS.TradedOrFilled,
  ORDER_STATUS.Transit,
];

export async function placeOrdersV2(
  contract: Contract,
  aiResponse: AIResponse
) {
  logger.info("Place Order fn started");
  const users = await UserModel.find({
    "metadata.accessToken": { $exists: true },
  }).lean();
  const { results, errors } = await PromisePool.for(users)
    .withConcurrency(20)
    .process(async (user: User) => {
      const accessToken = user.metadata?.accessToken;
      if (!user.metadata || !accessToken) {
        return;
      }

      if (user.metadata.pauseTrades) {
        logger.info(
          { userId: user._id.toString(), name: user.name },
          "Trades paused"
        );
        return;
      }
      const { fyersAppId, tradeQty } = user.metadata;
      const FyersAPI = require("fyers-api-v3").fyersModel;
      const fyers = new FyersAPI();
      fyers.setAppId(fyersAppId);
      fyers.setRedirectUrl(REDIRECT_URL);
      fyers.setAccessToken(accessToken);
      const positionRes = await getNetPositions(fyers);
      logger.info(
        { positionRes, userId: user._id.toString(), name: user.name },
        "positions"
      );
      if (positionRes.overall.count_total > 0) {
        logger.info(
          { userId: user._id.toString(), name: user.name },
          "Today position already there, so skipping.. "
        );
        return;
      }

      const ordersRes = await getAllOrders(fyers);

      const isOrderForTodayAlreadyDone = ordersRes.orderBook.some(
        (order: any) => completedOrderStatus.includes(order.status)
      );
      if (isOrderForTodayAlreadyDone) {
        logger.info(
          { userId: user._id.toString(), name: user.name },
          "No more trades to execute for today!"
        );
        return;
      }

      const fundsRes = await getFundsDetails(fyers);

      const availableBalance =
        fundsRes.fund_limit.find((item) => item.id === AVAILABLE_BALANCE_ID)
          ?.equityAmount || 0;
      logger.info(
        {
          fundsRes,
          userId: user._id.toString(),
          name: user.name,
          availableBalance,
        },
        "users fund balance"
      );

      const limitPrice = aiResponse.ltp + 1;
      const qty = getQuantitiesFromAvailableBalance(
        availableBalance,
        limitPrice
      );

      logger.info(
        {
          userId: user._id.toString(),
          name: user.name,
          tradeQty: qty,
        },
        "calculated trade qty from available balance"
      );

      if (qty === 0) {
        logger.info(
          {
            userId: user._id.toString(),
            name: user.name,
          },
          "skipping trade becoz of qty"
        );
        return;
      }

      // if not, then create a new order with 30 point SL, and 50 point target.
      const orderRequest: OrderRequest = {
        symbol: contract.symbol,
        qty, // TODO change dynamically
        limitPrice,
        stopPrice: aiResponse.ltp,
        stopLoss: DEFAULT_SL,
        takeProfit: TAKE_PROFIT,
      };
      const res = await placeOrder(fyers, orderRequest);
      logger.info(
        { orderRes: res, userId: user._id.toString(), name: user.name },
        "Order placed"
      );

      const coOrder: any = res[1]?.value || null;

      if (coOrder) {
        memCache.set(`CO:${user._id.toString()}`, coOrder.id);
      }

      if (user.isAdmin) {
        await sendMessageToChannel(`Trade Execution ${
          res.s !== "error" ? "Success" : "Failed"
        }:
  ${aiResponse.indexName} ${aiResponse.strike} ${aiResponse.type} above ${
          aiResponse.ltp
        } `);
      }
    });

  logger.info({ results, errors }, "Place Order fn ended");
}

function getQuantitiesFromAvailableBalance(
  amount: number,
  limitPrice: number
): number {
  if (amount <= 0) {
    return 0;
  }
  const bufferPrice = 70;

  const fundsToBeUsed = 0.6 * amount;
  const qty =
    Math.floor(fundsToBeUsed / ((limitPrice + bufferPrice) * LOT_SIZE)) *
    LOT_SIZE;
  return qty;
}
