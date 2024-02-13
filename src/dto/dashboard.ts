import type { FundTs } from "../models/FundTs";

export interface DashboardData {
  usersCount: number;
  usersOnboarded: number;
  userCountWithExpiredRefreshToken: number;
  activeUsers: number;
  totalFunds: number;
  highestActiveFund: number;
  fundsTs: FundTs[];
}
