import { TEMPORARY_CACHED_DATA_KEYS } from "../constants/cacheKeys";
import { logger } from "../logger";
import client from "./cache";
import memCache from "./mem-cache";

export function getCurrentDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0"); // Month is zero-based
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export async function safeMemCacheSet<T>(
  key: string,
  data: T,
  ttlInSeconds: number
) {
  memCache.set<T>(key, data, ttlInSeconds);
  await client.set(key, JSON.stringify(data));
  await client.expire(key, ttlInSeconds);
}

function parseString(value: any) {
  // Try parsing the value as JSON
  try {
    const parsedJSON = JSON.parse(value);
    return parsedJSON;
  } catch (error) {
    // If parsing as JSON fails, check if it's a number
    if (!isNaN(value)) {
      // If it's a number, convert it to a number type
      return parseFloat(value);
    } else if (
      value.toLowerCase() === "true" ||
      value.toLowerCase() === "false"
    ) {
      // If it's a boolean string, convert it to a boolean type
      return value.toLowerCase() === "true";
    } else {
      // Otherwise, return the original string
      return value;
    }
  }
}

export async function loadAllCachedData() {
  logger.info("Loading all cached data");
  let data = await client.mget(TEMPORARY_CACHED_DATA_KEYS);
  data = data.map(parseString);
  data.forEach((item, idx) =>
    memCache.set(TEMPORARY_CACHED_DATA_KEYS[idx], item)
  );
  logger.info(
    {
      data: data.map((item, idx) => ({
        key: TEMPORARY_CACHED_DATA_KEYS[idx],
        value: item,
      })),
    },
    "Loading of cached data completed"
  );
}
