import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import "./src/utils/login";
import { logger } from "./src/logger";
import { processTelegramMessage, type TelegramMessage } from "./src/telegram";
import "./src/utils/heartbeat";
import { connectToDB } from "./src/db";
import router from "./src/routes";
import jwt from "jsonwebtoken";
const { JWT_SECRET_KEY } = process.env;
import { UserModel } from "./src/models/User";
import cookieParser from "cookie-parser";

const app = express();

app.use(express.json());
app.use(cookieParser());
const port = 3001;

// Middleware to authenticate requests using Passport
const authenticateJWT = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies["jwt"];
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    // Decode the JWT token
    const decodedToken: any = jwt.verify(token, JWT_SECRET_KEY!);

    // Check if token has expired
    if (Date.now() >= decodedToken.exp * 1000) {
      res.clearCookie("jwt");
      return res.status(401).json({ message: "Token expired" });
    }

    // The decoded payload (claims)
    const dbUser = await UserModel.findById(decodedToken.id);

    if (!dbUser) {
      res.clearCookie("jwt");
      return res.status(401).json({ message: "Unauthorised" });
    }

    req.user = dbUser;
  } catch (error: any) {
    console.error("JWT Verification Error:", error.message);
    return res.status(401).json({ message: "Unauthorized" });
  }

  return next();
};

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
