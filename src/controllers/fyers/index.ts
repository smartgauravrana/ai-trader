import { type Response, type Request, type NextFunction } from "express";
import fetch from "node-fetch";
import { UserModel } from "../../models/User";
import { Forbidden } from "http-errors";
import { logger } from "../../logger";

const { REDIRECT_URL, WEBAPP_URL } = process.env;

interface RefreshTokenRequest {
  appId: string;
  appSecret: string;
  refresh_token: string;
  pin: string;
}

interface TokenResponse {
  s: string;
  code: number;
  message: string;
  access_token?: string;
}

export async function getAuthUrl(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.user?.metadata) {
    return next(Forbidden("Please update Profile data"));
  }

  const { fyersAppId } = req.user.metadata;

  // Create a new instance of FyersAPI
  const FyersAPI = require("fyers-api-v3").fyersModel;
  const fyers = new FyersAPI();
  // Set your APPID obtained from Fyers (replace "xxx-1xx" with your actual APPID)
  fyers.setAppId(fyersAppId);

  // Set the RedirectURL where the authorization code will be sent after the user grants access
  // Make sure your redirectURL matches with your server URL and port
  fyers.setRedirectUrl(REDIRECT_URL);

  // Generate the URL to initiate the OAuth2 authentication process and get the authorization code
  const generateAuthcodeURL = fyers.generateAuthCode();
  res.success({
    data: generateAuthcodeURL,
  });
}

export async function handleRedirectUri(req: Request, res: Response) {
  logger.info("In redirect handler");
  const { fyersAppId, fyersSecretId } = req.user?.metadata!;

  const FyersAPI = require("fyers-api-v3").fyersModel;
  const fyers = new FyersAPI();
  fyers.setAppId(fyersAppId);

  const authcode = req.query.auth_code; // Replace with the actual authorization code obtained from the user
  const secretKey = fyersSecretId; // Replace with your secret key provided by Fyers
  const tokenRes = await fyers.generate_access_token({
    secret_key: secretKey,
    auth_code: authcode,
  });

  if (tokenRes.code === 200) {
    //success
    const { access_token, refresh_token } = tokenRes;
    await UserModel.findByIdAndUpdate(req.user?.id, {
      $set: {
        "metadata.accessToken": access_token,
        "metadata.refreshToken": refresh_token,
      },
    });
  } else {
    return res.redirect(WEBAPP_URL! + "?success=false");
  }

  res.redirect(WEBAPP_URL! + "?success=true");
}

export async function validateRefreshToken(
  tokenRequest: RefreshTokenRequest
): Promise<TokenResponse> {
  try {
    const response = await fetch(
      "https://api-t1.fyers.in/api/v3/validate-refresh-token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          grant_type: "refresh_token",
          appIdHash: getAppIdHash(tokenRequest.appId, tokenRequest.appSecret),
          refresh_token: tokenRequest.refresh_token,
          pin: tokenRequest.pin,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to validate refresh token: ${response.statusText}`
      );
    }

    const responseData = await response.json();
    return responseData as TokenResponse;
  } catch (error: any) {
    console.error("Error validating refresh token:", error.message);
    throw error;
  }
}

function getAppIdHash(appId: string, appSecret: string) {
  const hasher = new Bun.CryptoHasher("sha256");

  hasher.update(appId + ":" + appSecret);
  return hasher.digest().toString();
}
