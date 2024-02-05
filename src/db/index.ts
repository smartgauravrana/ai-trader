import { connect } from "mongoose";
import { logger } from "../logger";

const { MONGODB_URI } = process.env;

export async function connectToDB() {
  logger.info("connecting to DB");
  await connect(MONGODB_URI!);
  logger.info("connected");
}
