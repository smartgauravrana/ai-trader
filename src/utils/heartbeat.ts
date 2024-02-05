import { logger } from "../logger";

const { TELEGRAM_LISTENER_HEARTBEAT } = process.env;

const HEALTH_CHECK_URL = "http://127.0.0.1:3002/health";
const INTERVAL_TIME_MS = 2 * 60 * 1000; // 2 minutes in milliseconds

async function checkHealthAndHitOtherUrl() {
  try {
    // Check health
    const response = await fetch(HEALTH_CHECK_URL);

    // If health check is successful (status code 200), hit the other URL
    if (response.ok) {
      const responseData: any = await response.json();

      if (responseData.status == true) {
        await fetch(TELEGRAM_LISTENER_HEARTBEAT!);
        logger.info("Successfully hit the other URL");
      }
    } else {
      logger.info("Health check failed");
    }
  } catch (error: any) {
    console.error("Error:", error.message);
  }
}

// Start checking health and hitting the other URL at the specified interval
setInterval(checkHealthAndHitOtherUrl, INTERVAL_TIME_MS);
