import express from "express";
import "./src/utils/login"
import "./src/telegram/utils"
import { logger } from "./src/logger";


const app = express();
const port = 3000;

app.get('/message', async (req: any, res: any) => {

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

app.listen(port, () => {
    logger.info(`Listening on port ${port}...`);
});

