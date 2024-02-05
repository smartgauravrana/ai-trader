import { type Response, type Request } from "express";
import { CustomerModel } from "../../models/Customer";
import { getFundsDetails } from "../../broker/fyers";
import getAccessToken, {
  getFyersAccessTokenForUser,
  type FyersTokenRequest,
} from "../../utils/login";
import type { CreateCustomerRequest } from "../../dto/customer";

export async function getCustomersList(_, res: Response) {
  const data = await CustomerModel.find().lean();
  res.send(data);
}

export async function createCustomer(
  req: Request<{}, {}, CreateCustomerRequest>,
  res: Response
) {
  const {
    fyersAppId,
    fyersId,
    fyersPin,
    fyersSecretId,
    fyersRedirectUrl,
    totpKey,
  } = req.body;
  const tokenRequest: FyersTokenRequest = {
    appId: fyersAppId,
    appSecret: fyersSecretId,
    fyersId,
    redirectUrl: fyersRedirectUrl,
    pin: fyersPin,
    totpKey,
  };
  // const token = await getFyersAccessTokenForUser(tokenRequest);
  // const token = await getAccessToken();
  // const fundsRes = await getFundsDetails(token);
  // console.log("fundRes: ", fundsRes);
  const data = await CustomerModel.create(req.body);
  res.send(data);
}
