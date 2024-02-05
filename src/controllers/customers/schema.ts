import { z } from "zod";

// Define a Zod schema for request validation
export const createCustomerSchema = z.object({
  name: z.string().nonempty("Name is required"),
  phone: z.string().nonempty("Phone is required"),
  email: z.string().email("email is required"),
  fyersId: z.string().nonempty("Fyers Account Id is required"),
  fyersAppId: z.string().nonempty("Fyers App Id is required"),
  fyersSecretId: z.string().nonempty("Fyers Secret Id is required"),
  // botToken: z.string().optional(),
  fyersPin: z.string().nonempty("Fyers Pin is required"),
  fyersRedirectUrl: z.string().url().nonempty("Fyers Redirect Url is required"),
  totpKey: z.string().nonempty("Totp Key is required"),
  // telegramBotToken: z.string().optional(),
  // telegramNotificationChannel: z.string().optional(),
  // status: z.string().optional(),
});
