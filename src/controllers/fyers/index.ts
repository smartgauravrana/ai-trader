import { type Response, type Request } from "express";

export async function getAuthUrl(_, res: Response) {
  // Create a new instance of FyersAPI
  const FyersAPI = require("fyers-api-v3").fyersModel;
  const fyers = new FyersAPI();
  // Set your APPID obtained from Fyers (replace "xxx-1xx" with your actual APPID)
  fyers.setAppId("xxx-1xx");

  // Set the RedirectURL where the authorization code will be sent after the user grants access
  // Make sure your redirectURL matches with your server URL and port
  fyers.setRedirectUrl(`https://xxx`);

  // Generate the URL to initiate the OAuth2 authentication process and get the authorization code
  const generateAuthcodeURL = fyers.generateAuthCode();
  res.send({
    data: generateAuthcodeURL,
  });
}

export async function handleRedirectUri(req: Request, res: Response) {
  const FyersAPI = require("fyers-api-v3").fyersModel;
  const fyers = new FyersAPI();
  fyers.setAppId("xxx-1xx");

  const authcode = req.query.auth_code; // Replace with the actual authorization code obtained from the user
  const secretKey = "xxx"; // Replace with your secret key provided by Fyers
  const token = await fyers.generate_access_token({
    secret_key: secretKey,
    auth_code: authcode,
  });
  res.send({ data: token });
}
