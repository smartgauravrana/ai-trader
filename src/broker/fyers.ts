export type OrderRequest = {
    symbol: string;
    qty: number;
    limitPrice: number;
    stopPrice: number;
    stopLoss: number;
    takeProfit: number;
}



const fyersModel = require("fyers-api-v3").fyersModel
const APP_TYPE = "100";

const fyers = new fyersModel({ "path": "path where you want to save logs", "enableLogging": false })

const { FYERS_APP_ID, FYERS_SECRET_ID, REDIRECT_URL } = process.env;

fyers.setAppId(`${FYERS_APP_ID}-${APP_TYPE}`);

fyers.setRedirectUrl(REDIRECT_URL)




export function getProfileData(fyers: any) {
    fyers.get_profile().then((response) => {
        console.log(response)
    }).catch((err) => {
        console.log(err)
    })
}

export function getQuotes(fyers: any) {
    fyers.getQuotes(["NSE:SBIN-EQ", "NSE:TCS-EQ"]).then((response) => {
        console.log(response)
    }).catch((err) => {
        console.log(err)
    })
}

export function getMarketDepth() {
    fyers.getMarketDepth({ "symbol": ["NSE:SBIN-EQ", "NSE:TCS-EQ"], "ohlcv_flag": 1 }).then((response) => {
        console.log(response)
    }).catch((err) => {
        console.log(err)
    })
}

export function placeOrder(token: string, createOrderReq: OrderRequest): Promise<any> {
    fyers.setAccessToken(token)
    const { symbol, qty, limitPrice, stopLoss, takeProfit, stopPrice } = createOrderReq;
    const reqBody = {
        symbol,
        qty,
        "type": 4,
        "side": 1, // buy
        "productType": "BO",
        limitPrice,
        stopPrice,
        "disclosedQty": 0,
        "validity": "DAY",
        "offlineOrder": false,
        stopLoss,
        takeProfit,
    }
    return fyers.place_order(reqBody)
}


// fyers.get_profile().then((response) => {
//   console.log(response)
// }).catch((err) => {
//   console.log(err)
// })

// fyers.getQuotes(["NSE:SBIN-EQ", "NSE:TCS-EQ"]).then((response) => {
//   console.log(response)
// }).catch((err) => {
//   console.log(err)
// })

// fyers.getMarketDepth({ "symbol": ["NSE:SBIN-EQ", "NSE:TCS-EQ"], "ohlcv_flag": 1 }).then((response) => {
//   console.log(response)
// }).catch((err) => {
//   console.log(err)
// })
