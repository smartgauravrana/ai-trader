import express, { type Request, type Response } from "express";
import "./src/utils/login";
import { logger } from "./src/logger";
import { processTelegramMessage, type TelegramMessage } from "./src/telegram";
import "./src/utils/heartbeat";
import { connectToDB } from "./src/db";
import router from "./src/routes";
import cookieParser from "cookie-parser";
import { authenticateJWT } from "./src/middleware/authenticate";
import { loginHandler, logout } from "./src/controllers/auth";
import { successHandler } from "./src/middleware/successHandler";
import { errorHandler } from "./src/middleware/errorHandler";
import cron from "node-cron";
import { handleTokenRefresh } from "./src/jobs/tokenRefresh";

const port = 3001;
const app = express();

// 8am IST
cron.schedule("30 2 * * *", handleTokenRefresh);
// 7pm IST
cron.schedule("30 13 * * *", handleTokenRefresh);

app.use(express.json());
app.use(successHandler);
app.use(cookieParser());

app.post(
  "/message",
  async (req: Request<{}, {}, TelegramMessage>, res: Response) => {
    const message = req.body;
    res.send("OK");
    await processTelegramMessage(message);
  }
);

app.post("/api/login", loginHandler);
app.get("/api/logout", logout);

app.use(authenticateJWT);

app.get("/redirect-fyers", (req: any, res: any) => {
  console.log(req.query);
  res.send("Hello World!");
});
app.post("/webhook", (req: any, res: any) => {
  console.log(req.body);
  res.send("webhook!");
});
app.get("/webhook", (req: any, res: any) => {
  console.log(req.body);
  res.send("webhook");
});

app.use("/api", router);

// Error handling middleware
app.use(errorHandler);

// connect to db
connectToDB()
  .then(() => {
    app.listen(port, "0.0.0.0", () => {
      logger.info(`Listening on port ${port}... 🚀`);
    });
  })
  .catch((err) => console.log("err: ", err));
