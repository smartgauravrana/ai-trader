import { PromisePool } from "@supercharge/promise-pool";
import { logger } from "../logger";
import { User, UserModel } from "../models/User";
import { sendEmail } from "../services/mail";
import { isTokenExpired } from "../controllers/users";
import { validateRefreshToken } from "../controllers/fyers";

const { EMAIL_DOMAIN } = process.env;

export async function handleTokenRefresh() {
  try {
    logger.info("handleTokenRefresh cron started");

    const users = await UserModel.find({
      "metadata.accessToken": { $exists: true },
    }).lean();
    const { results, errors } = await PromisePool.for(users).process(
      async (user: User) => {
        if (!user.metadata) {
          return;
        }

        const { refreshToken, fyersAppId, fyersSecretId, pin } = user.metadata;

        // const accessTknExpired = isTokenExpired(accessToken!);
        const refreshTokenExpired = isTokenExpired(refreshToken!);

        if (refreshTokenExpired) {
          logger.info(
            {
              userId: user._id.toString(),
            },
            "refresh token expired, sending email"
          );
          // send notification if refresh token expired
          if (!user.email) {
            return;
          }
          await sendEmail({
            sender: {
              name: "no-reply",
              email: `no-reply@${EMAIL_DOMAIN}`,
            },
            to: [
              {
                name: user.name,
                email: user.email,
              },
            ],
            subject: "REMINDER AI TRADE",
            htmlContent: `<html><head></head><body><p>Hello,</p>Hey ${user.name}, <br/>You need to link your Fyers account urgently to continue AI trades. <br/> Please login now and link fyers account.</p></body></html>`,
          });
        } else {
          // if not then refresh the access token;
          logger.info(
            {
              userId: user._id.toString(),
            },
            "refresh token started"
          );
          const tokenRes = await validateRefreshToken({
            appId: fyersAppId,
            appSecret: fyersSecretId,
            pin: pin,
            refresh_token: refreshToken || "",
          });

          if (tokenRes.access_token) {
            await UserModel.findByIdAndUpdate(user._id, {
              $set: {
                "metadata.accessToken": tokenRes.access_token,
              },
            });
            logger.info(
              {
                userId: user._id.toString(),
              },
              "refresh token done"
            );
          }
        }
      }
    );

    logger.info({ results, errors }, "refresh token job completed");
  } catch (err: any) {
    logger.error({ err }, `Error inside handleTokenRefresh: ${err?.message}`);
  }
}
