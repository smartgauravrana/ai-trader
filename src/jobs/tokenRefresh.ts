import { PromisePool } from "@supercharge/promise-pool";
import { logger } from "../logger";
import { User, UserModel } from "../models/User";

export async function handleTokenRefresh() {
  try {
    console.log("cron started");
    // const users = await UserModel.find({
    //   "metadata.accessToken": { $exists: true },
    // }).lean();
    // const { results, errors } = await PromisePool.for(users).process(
    //   async (user: User) => {}
    // );
  } catch (err: any) {
    logger.error({ err }, `Error inside handleTokenRefresh: ${err?.message}`);
  }
}
