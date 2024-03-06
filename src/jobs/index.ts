import cron from "node-cron";
import { handleTokenRefresh } from "./tokenRefresh";
import { aggregateFundsData } from "./dashboard";
import startListenData from "../ws";

// 8am IST
cron.schedule("30 2 * * *", handleTokenRefresh);
// 7pm IST
cron.schedule("30 13 * * *", handleTokenRefresh);

// cron.schedule("* * * * *", startListenData);

// 10 pm IST
cron.schedule("30 14 * * *", aggregateFundsData);
