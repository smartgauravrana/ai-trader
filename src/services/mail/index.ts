import fetch from "node-fetch";
import { logger } from "../../logger";

const { BREVO_API_KEY } = process.env;

export interface EmailRequest {
  sender: {
    name: string;
    email: string;
  };
  to: {
    name?: string;
    email: string;
  }[];
  subject: string;
  htmlContent: string;
}

export async function sendEmail(emailRequest: EmailRequest): Promise<void> {
  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "api-key": BREVO_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailRequest),
    });

    if (!response.ok) {
      throw new Error(`Failed to send email: ${response.statusText}`);
    }

    const responseData = await response.json();
    logger.info({ responseData }, "Email sent successfully:");
  } catch (error: any) {
    logger.error("Error sending email:", error.message);
    throw error;
  }
}
