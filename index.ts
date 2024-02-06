import express, { type Request, type Response } from "express";
import "./src/utils/login";
import { logger } from "./src/logger";
import { processTelegramMessage, type TelegramMessage } from "./src/telegram";
import "./src/utils/heartbeat";
import { connectToDB } from "./src/db";
import router from "./src/routes";
import cookieParser from "cookie-parser";

const app = express();

app.use(express.json());
app.use(cookieParser());
const port = 3001;

app.post(
  "/message",
  async (req: Request<{}, {}, TelegramMessage>, res: Response) => {
    const message = req.body;
    res.send("OK");
    await processTelegramMessage(message);
  }
);

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

// connect to db
connectToDB()
  .then(() => {
    app.listen(port, "0.0.0.0", () => {
      logger.info(`Listening on port ${port}...`);
    });
  })
  .catch((err) => console.log("err: ", err));
