import type { Request, Response } from "express";
import { PromisePool } from "@supercharge/promise-pool";
import { User, UserModel } from "../../models/User";
import type { InviteUserRequest } from "./schema";
import asyncHandler from "../../utils/asyncHandler";
import type { DashboardData } from "../../dto/dashboard";
import { isTokenExpired } from "../users";
import { getFundsDetails } from "../../broker/fyers";

const { REDIRECT_URL } = process.env;

export const inviteUser = asyncHandler(
  async (req: Request<{}, {}, InviteUserRequest>, res: Response) => {
    const { phone, password, name } = req.body;

    const hashedPassword = await Bun.password.hash(password, {
      algorithm: "bcrypt",
      cost: 4,
    });
    const newUser = { phone, password: hashedPassword, name };
    const data = await UserModel.create(newUser);

    res.success({
      data,
    });
  }
);

export const getDashboardData = asyncHandler(
  async (req: Request<{}, {}, InviteUserRequest>, res: Response) => {
    const resultRes: DashboardData = {
      activeUsers: 0,
      usersCount: 0,
      usersOnboarded: 0,
      highestActiveFund: 0,
      totalFunds: 0,
      userCountWithExpiredRefreshToken: 0,
    };
    const usersCount = await UserModel.countDocuments({});

    const users = await UserModel.find({
      "metadata.accessToken": { $exists: true },
    }).lean();

    resultRes.usersCount = usersCount;
    resultRes.usersOnboarded = users.length;

    const usersWithValidRefreshToken = users.filter((user) => {
      const isRefreshTknExpired = isTokenExpired(
        user.metadata?.refreshToken || ""
      );
      return !isRefreshTknExpired;
    });

    resultRes.userCountWithExpiredRefreshToken =
      users.length - usersWithValidRefreshToken.length;

    const { results, errors } = await PromisePool.for(
      usersWithValidRefreshToken
    )
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

    console.log("result, errors", {
      results,
      errors,
    });

    let totalBal = 0;
    let highestFunds = 0;
    results.forEach((item) => {
      totalBal += item?.totalBalance;
      highestFunds = Math.max(highestFunds, item?.totalBalance);
    });

    resultRes.totalFunds = totalBal;
    resultRes.highestActiveFund = highestFunds;

    res.success({
      data: resultRes,
    });
  }
);
