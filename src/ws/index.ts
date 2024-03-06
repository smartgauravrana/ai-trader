import PromisePool from "@supercharge/promise-pool";
import { isTokenExpired } from "../controllers/users";
import { logger } from "../logger";
import { UserModel } from "../models/User";
import type { Contract } from "../optionContracts";
import memCache from "../utils/mem-cache";

const FyersSocket = require("fyers-api-v3").fyersDataSocket;

let fyersdata: any = null;

async function processMsg(ltp: number) {
  logger.info("ltp: " + ltp);

  const contract = await memCache.get<Contract>("contract");
  if (!contract) {
    logger.info("no contract in memcache");
    return;
  }

  const lastSL = await memCache.get<number>("lastSL");

  if (!lastSL && ltp < limitPrice) {
    return;
  }

  if (ltp > lastSL + 30) {
  }
  const allUserIds = memCache.get<string[]>("allUserIds");
  if (!allUserIds) {
    return;
  }
  const { results, errors } = await PromisePool.for(allUserIds)
    .withConcurrency(20)
    .process(async (userId: string) => {
      const orderId = await memCache.get(`CO:${userId}`);

      // update SL order with price plus 15
    });
}

export default async function startListenData() {
  const newLocal = "startListenData started...";
  console.log(newLocal);
  const contract = await memCache.get<Contract>("contract");
  if (!contract) {
    logger.info("no contract in memcache");
    return;
  }

  const users = await UserModel.find({}).sort({ createdAt: 1 }).lean();

  await memCache.set(
    "allUserIds",
    users.map((user) => user._id.toString())
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

  // return new Promise((resolve, reject) => {
  function onmsg(message: any) {
    // console.log("msg");
    const ltp = message.ltp;
    if (isNaN(ltp)) {
      return;
    }

    processMsg(ltp);
  }

  function onerror(err: unknown) {
    console.log(err);
    // reject(new Error("connection failed"));
  }

  function onclose() {
    console.log("socket closed");
  }

  fyersdata.on("message", onmsg);

  fyersdata.on("error", onerror);
  fyersdata.on("close", onclose);

  function onconnect() {
    fyersdata.subscribe([contract?.symbol]); //not subscribing for market depth data
    fyersdata.mode(fyersdata.LiteMode); //set data mode to lite mode
    fyersdata.autoreconnect(); //enable auto reconnection mechanism in case of disconnection
    // resolve("OK");
  }
  fyersdata.on("connect", onconnect);

  // connect
  fyersdata.connect();

  const closeTimeInSeconds = 5;

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
