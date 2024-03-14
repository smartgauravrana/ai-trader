import runAlgo from "../algo";
import { logger } from "../logger";
import client, { getKey } from "../utils/cache";

const { MYSTIC_CHANNEL_ID, ADMIN_CHANNEL_ID } = process.env;
export type TelegramMessage = {
  _: string; // Note: You may want to define a custom type for this
  id: number;
  peer_id?: {
    _: string; // Note: You may want to define a custom type for this
    channel_id?: number;
    user_id?: number;
  };
  date: string;
  message: string;
};

export const processTelegramMessage = async (message: TelegramMessage) => {
  const channelId = message.peer_id?.channel_id || message.peer_id?.user_id;
  const isFromChannel = Boolean(message.peer_id?.channel_id);

  logger.info(
    `receivedMsg: ${message.message} from ${
      isFromChannel ? "channelId" : "userId"
    } ${channelId} `
  );
  logger.info(`message type: ${message._}`);

  if (
    channelId === Number(MYSTIC_CHANNEL_ID) ||
    channelId === Number(ADMIN_CHANNEL_ID)
  ) {
    logger.info("processing message from Mystic received");
    const key = getKey(String(channelId));
    await client.rpush(key, message.message);

    runAlgo(String(channelId));
  }
};
