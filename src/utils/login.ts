import fetch from 'node-fetch';
import totp from 'totp-generator';
const FyersAPI = require("fyers-api-v3").fyersModel;

const BASE_URL = "https://api-t2.fyers.in/vagator/v2";
const BASE_URL_2 = "https://api-t1.fyers.in/api/v3";
const URL_SEND_LOGIN_OTP = `${BASE_URL}/send_login_otp`;
const URL_VERIFY_TOTP = `${BASE_URL}/verify_otp`;
const URL_VERIFY_PIN = `${BASE_URL}/verify_pin`;
const URL_TOKEN = `${BASE_URL_2}/token`;
const SUCCESS = 1;
const ERROR = -1;

async function sendLoginOTP(fy_id: string, app_id: string): Promise<[number, any]> {
  try {
    const response = await fetch(URL_SEND_LOGIN_OTP, {
      method: 'POST',
      body: JSON.stringify({ fy_id, app_id }),
      headers: { 'Content-Type': 'application/json' }
    });

    const data = await response.json();

    if (!response.ok) {
      return [ERROR, data];
    }

    const { request_key } = data;
    return [SUCCESS, request_key];
  } catch (error) {
    return [ERROR, error.message];
  }
}

async function verifyTOTP(request_key: string, totp: string): Promise<[number, any]> {
  try {
    const response = await fetch(URL_VERIFY_TOTP, {
      method: 'POST',
      body: JSON.stringify({ request_key, otp: totp }),
      headers: { 'Content-Type': 'application/json' }
    });

    const data = await response.json();

    if (!response.ok) {
      return [ERROR, data];
    }

    const { request_key: newRequestKey } = data;
    return [SUCCESS, newRequestKey];
  } catch (error) {
    return [ERROR, error.message];
  }
}

async function generateAccessToken(FY_ID: string, TOTP_KEY: string, PIN: string, APP_ID: string, REDIRECT_URI: string, APP_SECRET: string): Promise<[any, string]> {
  const APP_ID_TYPE = "2";
  const APP_TYPE = "100";

  const send_otp_result = await sendLoginOTP(FY_ID, APP_ID_TYPE);
  if (send_otp_result[0] !== SUCCESS) {
    console.log(`send_login_otp failure - ${send_otp_result[1]}`);
    process.exit(1);
  } else {
    console.log("send_login_otp success");
  }

  let verify_totp_result;
  for (let i = 1; i <= 3; i++) {
    const request_key = send_otp_result[1];
    verify_totp_result = await verifyTOTP(request_key, totp(TOTP_KEY));

    if (verify_totp_result[0] !== SUCCESS) {
      console.log(`verify_totp_result failure - ${verify_totp_result[1]}`);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait for 1 second before retrying
    } else {
      break;
    }
  }

  const request_key_2 = verify_totp_result[1];
  const payload_pin = {
    "request_key": request_key_2,
    "identity_type": "pin",
    "identifier": PIN,
    "recaptcha_token": ""
  };
  const res_pin = await fetch(URL_VERIFY_PIN, {
    method: 'POST',
    body: JSON.stringify(payload_pin),
    headers: { 'Content-Type': 'application/json' }
  });
  const data_pin = await res_pin.json();
  const access_token = data_pin['data']['access_token'];

  const authParam = {
    "fyers_id": FY_ID,
    "app_id": APP_ID,
    "redirect_uri": REDIRECT_URI,
    "appType": APP_TYPE,
    "code_challenge": "",
    "state": "None",
    "scope": "",
    "nonce": "",
    "response_type": "code",
    "create_cookie": true
  };

  let authres;
  try {
    authres = await fetch(URL_TOKEN, {
      method: 'POST',
      body: JSON.stringify(authParam),
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${access_token}` }
    });
  } catch (error) {
    authres = error.response;
  }
  const data_authres = await authres.json();
  const url = data_authres['Url'];
  const parsed = new URL(url);
  const auth_code = parsed.searchParams.get('auth_code');

  const fyers = new FyersAPI();
  fyers.setAppId(`${APP_ID}-${APP_TYPE}`);
  fyers.setRedirectUrl(REDIRECT_URI);

  let akstkn;
  try {
    const tokenResp = await fyers.generate_access_token({ "secret_key": APP_SECRET, "auth_code": auth_code });

    if (tokenResp.s == "ok") {
      akstkn = tokenResp.access_token;
      fyers.setAccessToken(tokenResp.access_token);
    } else {
      console.log("Error generating accessToken:", tokenResp);
      process.exit(1);
    }
  } catch (error) {
    console.log(error);
    process.exit(1);
  }

  return [fyers, akstkn];
}

const {
  FYERS_ID,
  FYERS_APP_ID,
  TOTP_KEY,
  FYERS_PIN,
  REDIRECT_URL,
  FYERS_SECRET_ID
} = process.env
export default async function getAccessToken() {
  const FYID = FYERS_ID;
  const TotpKey = TOTP_KEY;
  const Pin = FYERS_PIN;
  const APPID = FYERS_APP_ID;
  const RedirectURL = REDIRECT_URL;
  const AppSecret = FYERS_SECRET_ID;
  const resp = await generateAccessToken(FYID!, TotpKey!, Pin!, APPID!, RedirectURL!, AppSecret!);
  const token = resp[1];
  return token;
}


