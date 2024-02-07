import { type Response, type Request, type NextFunction } from "express";
import { UserModel } from "../../models/User";
import { Forbidden } from "http-errors";

const { REDIRECT_URL } = process.env;

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
  const { fyersAppId, fyersSecretId } = req.user?.metadata!;
  // return res.send({ status: "ok", data: req.query });
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
    return res.status(500).send({ data: tokenRes });
  }

  res.success({ data: tokenRes });
}
