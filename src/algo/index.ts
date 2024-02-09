import { askAI } from "../ai";

import { logger } from "../logger";
import { downloadOptionContracts, findContract } from "../optionContracts";

import cache, { getKey } from "../utils/cache";
import { placeOrders } from "./placeOrders";
const { MYSTIC_CHANNEL_ID } = process.env;

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

  // place order for each customer
  await placeOrders(contract, aiResponse);
}
