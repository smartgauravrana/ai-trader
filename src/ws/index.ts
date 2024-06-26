import PromisePool from "@supercharge/promise-pool";
import { isTokenExpired } from "../controllers/users";
import { logger } from "../logger";
import { UserModel } from "../models/User";
import memCache from "../utils/mem-cache";
import { ORDER_TYPES, SL_GAP_LIMIT, TAKE_PROFIT } from "../constants";
import { getAllOrders, modifyOrder } from "../broker/fyers";
import { KEYS } from "../constants/cacheKeys";
import type { CurrentTrade } from "../algo";
import { safeMemCacheSet } from "../utils";

const FyersSocket = require("fyers-api-v3").fyersDataSocket;

const { REDIRECT_URL } = process.env;

type UserIdWithToken = {
  id: string;
  token: string; // access token
  fyersAppId: string;
};

let fyersdata: any = null;

export async function getUpdatedSLPrice(
  ltp: number,
  currentTrade?: CurrentTrade
): Promise<number | null> {
  if (!currentTrade?.contract) {
    // logger.info("SOCKET: no contract in memcache");
    return null;
  }

  if (!currentTrade.aiResponse) {
    // logger.info("SOCKET: processMsg no ai response");
    return null;
  }

  const { aiResponse } = currentTrade;
  const targetPrice = aiResponse.ltp + TAKE_PROFIT;

  const lastSL = memCache.get<number>(KEYS.LAST_SL);

  if (!lastSL && ltp < targetPrice) {
    return null;
  }

  let newSL: number | null = null;

  if (!lastSL && ltp >= targetPrice) {
    // update lastSL to Cost to Cost
    newSL = aiResponse.ltp + Math.floor(TAKE_PROFIT / 2); // target: 430, sl: 415
    await safeMemCacheSet<number>(KEYS.LAST_SL, newSL, 7 * 60 * 60);
  }

  if (lastSL && ltp - lastSL > SL_GAP_LIMIT) {
    const diffLtpLastSL = ltp - lastSL;
    newSL = lastSL + (diffLtpLastSL - SL_GAP_LIMIT);
  }

  if (!newSL) {
    // logger.info("SOCKET: No SL to update");
    return newSL;
  }

  return newSL;
}

export async function processLtpMsg(ltp: number) {
  // logger.info("ltp: " + ltp);

  const currentTrade = memCache.get<CurrentTrade>(KEYS.CURRENT_TRADE);

  if (!currentTrade) {
    return;
  }

  const newSL = getUpdatedSLPrice(ltp, currentTrade);
  if (!newSL) {
    // logger.info("No need of SL to update");
    return;
  }

  const { contract } = currentTrade;
  const users =
    memCache.get<UserIdWithToken[]>(KEYS.ALL_USER_IDS_WITH_TOKEN) || [];
  const { results, errors } = await PromisePool.for(
    users.filter((user) => {
      if (!isTokenExpired(user.token)) {
        return true;
      }
    })
  )
    .withConcurrency(20)
    .process(async ({ id, token, fyersAppId }: UserIdWithToken) => {
      if (!token || !fyersAppId) {
        return;
      }

      const FyersAPI = require("fyers-api-v3").fyersModel;
      const fyers = new FyersAPI();
      fyers.setAppId(fyersAppId!);
      fyers.setRedirectUrl(REDIRECT_URL!);
      fyers.setAccessToken(token!);

      // get the order to update with productType CO and type SL
      const ordersRes = await getAllOrders(fyers);
      let COSellOrder = null;
      if (ordersRes.s === "ok") {
        COSellOrder = ordersRes.orderBook.find(
          (order: any) =>
            order.productType === "CO" &&
            order.symbol === contract.symbol &&
            order.type === 4 &&
            order.status === 6
        );
      }
      // update SL order with price plus 15

      if (!COSellOrder) {
        // logger.info({ userId: id }, "No sell order of CO type");
        return;
      }

      await modifyOrder(fyers, {
        id: COSellOrder?.id as string,
        stopPrice: newSL as any,
        limitPrice: Number(newSL) - 4,
        type: ORDER_TYPES.SL_LIMIT,
      });
    });

  // logger.info({ results, errors }, "Updated SL for CO Orders");
}

export default async function startListenData() {
  const newLocal = "startListenData started...";
  console.log(newLocal);
  const currentTrade = memCache.get<CurrentTrade>(KEYS.CURRENT_TRADE);
  if (!currentTrade?.contract) {
    logger.info("no contract in memcache");
    return;
  }

  const users = await UserModel.find({
    "metadata.accessToken": { $exists: true },
  })
    .sort({ createdAt: 1 })
    .lean();

  await safeMemCacheSet<UserIdWithToken[]>(
    KEYS.ALL_USER_IDS_WITH_TOKEN,
    users.map((user) => ({
      id: user._id.toString(),
      token: user.metadata?.accessToken || "",
      fyersAppId: user.metadata?.fyersAppId || "",
    })),
    7 * 60 * 60
  );

  const userWithValidAccessToken = users.find((user) => {
    if (user.metadata?.accessToken) {
      if (!isTokenExpired(user.metadata.accessToken)) {
        return user;
      }
    }
  });

  if (!userWithValidAccessToken) {
    logger.info("user not found with valid access token");
    return;
  }

  logger.info(
    { user: userWithValidAccessToken?.name },
    "user found with token"
  );
  fyersdata = new FyersSocket(
    `${userWithValidAccessToken.metadata?.fyersAppId}:${userWithValidAccessToken.metadata?.accessToken}`
  );

  function onmsg(message: any) {
    const ltp = message.ltp;
    if (isNaN(ltp)) {
      return;
    }

    processLtpMsg(ltp);
  }

  function onerror(err: unknown) {
    logger.error(err, "ws: error");
    console.log(err);
  }

  function onclose() {
    console.log("socket closed");
  }

  fyersdata.on("message", onmsg);

  fyersdata.on("error", onerror);
  fyersdata.on("close", onclose);

  const { contract } = currentTrade;

  function onconnect() {
    fyersdata.subscribe([contract?.symbol]); //not subscribing for market depth data
    fyersdata.mode(fyersdata.LiteMode); //set data mode to lite mode
    fyersdata.autoreconnect(); //enable auto reconnection mechanism in case of disconnection
    // resolve("OK");
  }
  fyersdata.on("connect", onconnect);

  // connect
  fyersdata.connect();

  const closeTimeInSeconds = 7 * 60 * 60; //hours

  setTimeout(() => {
    logger.info("closing socket connection");
    fyersdata.close();
  }, closeTimeInSeconds * 1000);
  // });
}

export async function isSocketConnected() {
  if (fyersdata) {
    return await fyersdata.isConnected();
  }
  return false;
}
