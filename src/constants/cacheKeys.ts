export const KEYS = {
  ALL_USER_IDS_WITH_TOKEN: "allUserIdsWithToken",
  CONTRACT: "contract",
  AI_RESPONSE: "aiResponse",
  CURRENT_TRADE: "currentTrade",
  LAST_SL: "lastSL",
};

export const TEMPORARY_CACHED_DATA_KEYS = [
  KEYS.AI_RESPONSE,
  KEYS.ALL_USER_IDS_WITH_TOKEN,
  KEYS.CONTRACT,
  KEYS.CURRENT_TRADE,
  KEYS.LAST_SL,
];

export const getCOOrderIdKey = (userId: string) => `CO:${userId}`;
