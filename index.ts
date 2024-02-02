import fetch from 'node-fetch';
import express, { type Request, type Response } from "express";
import "./src/utils/login"
// import "./src/telegram/utils"
import { logger } from "./src/logger";
import { processTelegramMessage, type TelegramMessage } from "./src/telegram";

const HEALTH_CHECK_URL = 'http://127.0.0.1:3002/health';
const INTERVAL_TIME_MS = 2 * 60 * 1000; // 2 minutes in milliseconds

const { TELEGRAM_LISTENER_HEARTBEAT } = process.env;

async function checkHealthAndHitOtherUrl() {
    try {
        // Check health
        const response = await fetch(HEALTH_CHECK_URL);

        // If health check is successful (status code 200), hit the other URL
        if (response.ok) {
            const responseData: any = await response.json();

            if (responseData.status == true) {

                await fetch(TELEGRAM_LISTENER_HEARTBEAT!);
                logger.info('Successfully hit the other URL');
            }
        } else {
            logger.info('Health check failed');
        }
    } catch (error: any) {
        console.error('Error:', error.message);
    }
}

// Start checking health and hitting the other URL at the specified interval
setInterval(checkHealthAndHitOtherUrl, INTERVAL_TIME_MS);

const app = express();

app.use(express.json())
const port = 3001;

app.post('/message', async (req: Request<{}, {}, TelegramMessage>, res: Response) => {
    const message = req.body;
    res.send("OK");
    await processTelegramMessage(message);
})

app.get("/redirect-fyers", (req: any, res: any) => {
    console.log(req.query)
    res.send("Hello World!");
});
app.post("/webhook", (req: any, res: any) => {
    console.log(req.body)
    res.send("webhook!");
});
app.get("/webhook", (req: any, res: any) => {
    console.log(req.body)
    res.send("webhook");
});

app.listen(port, '0.0.0.0', () => {
    logger.info(`Listening on port ${port}...`);
});

