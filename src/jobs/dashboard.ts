import { PromisePool } from "@supercharge/promise-pool";
import { FundTs, FundTsModel } from "../models/FundTs";
import { User, UserModel } from "../models/User";
import { isTokenExpired } from "../controllers/users";
import { getFundsDetails } from "../broker/fyers";
import { getCurrentDate } from "../utils";
import { logger } from "../logger";

const { REDIRECT_URL } = process.env;

export async function aggregateFundsData() {
  logger.info("aggregate job started");
  const users = await UserModel.find({
    "metadata.accessToken": { $exists: true },
  }).lean();

  const usersWithValidRefreshToken = users.filter((user) => {
    const isRefreshTknExpired = isTokenExpired(
      user.metadata?.refreshToken || ""
    );
    return !isRefreshTknExpired;
  });
  const { results, errors } = await PromisePool.for(usersWithValidRefreshToken)
    .withConcurrency(20)
    .process(async (user: User) => {
      const accessToken = user.metadata?.accessToken;
      const response = {
        totalBalance: 0,
      };
      if (!user.metadata || isTokenExpired(accessToken || "")) {
        return response;
      }
      const { fyersAppId } = user.metadata;
      const FyersAPI = require("fyers-api-v3").fyersModel;
      const fyers = new FyersAPI();
      fyers.setAppId(fyersAppId);
      fyers.setRedirectUrl(REDIRECT_URL);
      fyers.setAccessToken(accessToken);
      const fundsRes = await getFundsDetails(fyers);
      const fundsList = fundsRes.fund_limit;
      const [totalBalInfo] = fundsList;

      if (totalBalInfo) {
        response.totalBalance += totalBalInfo.equityAmount;
      }
      return response;
    });

  logger.info({ results, errors }, "aggregate jon promise res");

  const aggregateInfo = {
    amount: 0,
    date: new Date(),
  };

  results.forEach((item) => {
    aggregateInfo.amount += item.totalBalance;
  });
  aggregateInfo.date = new Date(getCurrentDate());
  await FundTsModel.create();
  logger.info("aggregate job completed");
}
