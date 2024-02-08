import { connect } from "mongoose";
import { logger } from "../logger";
import { UserModel } from "../models/User";

const { MONGODB_URI, FIRST_USER_NAME, FIRST_USER_PWD, FIRST_USER_PHONE } =
  process.env;

export async function insertFirstUser() {
  if (!FIRST_USER_NAME || !FIRST_USER_PHONE || !FIRST_USER_PWD) {
    throw new Error("Provide env values for script");
  }

  logger.info("connecting to DB");
  await connect(MONGODB_URI!);
  logger.info("connected");

  const hashedPassword = await Bun.password.hash(FIRST_USER_PWD, {
    algorithm: "bcrypt",
    cost: 4,
  });

  const firstUser = {
    phone: FIRST_USER_PHONE,
    password: hashedPassword,
    name: FIRST_USER_NAME,
  };

  await UserModel.create(firstUser);
  logger.info("User created successfully");
  process.exit(0);
}

insertFirstUser().catch(console.error);
