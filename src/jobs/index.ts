import cron from "node-cron";
import { handleTokenRefresh } from "./tokenRefresh";
import { aggregateFundsData } from "./dashboard";

// 8am IST
cron.schedule("30 2 * * *", handleTokenRefresh);
// 7pm IST
cron.schedule("30 13 * * *", handleTokenRefresh);

// 10 pm IST
cron.schedule("30 17 * * *", aggregateFundsData);
