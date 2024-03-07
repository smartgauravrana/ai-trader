import { askAI, type AIResponse } from "../ai";
import { KEYS } from "../constants/cacheKeys";

import { logger } from "../logger";
import {
  type Contract,
  downloadOptionContracts,
  findContract,
} from "../optionContracts";
import { safeMemCacheSet } from "../utils";

import cache, { getKey } from "../utils/cache";
import memCache from "../utils/mem-cache";
import startListenData, { isSocketConnected } from "../ws";
import { placeOrders } from "./placeOrders";
import { placeOrdersV2 } from "./placeOrdersV2";
const { MYSTIC_CHANNEL_ID } = process.env;

export type CurrentTrade = {
  contract: Contract;
  aiResponse: AIResponse;
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default async function runAlgo() {
  // process message with AI LLM
  const key = getKey(MYSTIC_CHANNEL_ID!);
  let message = await cache.lrange(key, 0, -1);
  let messageStr = message.join("\n");

  const aiResponse = await askAI(messageStr);
  logger.info({ aiResponse }, "response from ai");
  if (!aiResponse) {
    logger.info("NO TRADE");
    return;
  }

  // find all bank nifty contracts
  const optionsContracts = await downloadOptionContracts();

  // find the appropriate contract
  const contract = findContract(
    optionsContracts,
    aiResponse?.strike,
    aiResponse?.type
  );

  if (!contract) {
    logger.info("no contract found!");
    return;
  }
  logger.info({ contract }, "contract found!");

  await safeMemCacheSet<CurrentTrade>(
    KEYS.CURRENT_TRADE,
    {
      contract: contract,
      aiResponse: aiResponse,
    },
    7 * 60 * 60
  ); // 7 hrs expiry

  // start socket listener
  if (!(await isSocketConnected())) {
    await startListenData();
  }

  await delay(2500);
  let isConnected = await isSocketConnected();
  logger.info({ isConnected }, "Socket connection status: ");

  // place order for each customer
  if (isConnected) {
    await placeOrdersV2(contract, aiResponse);
  } else {
    await placeOrders(contract, aiResponse);
  }
}
