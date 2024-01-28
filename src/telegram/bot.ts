const TelegramBot = require('node-telegram-bot-api');

const { BOT_TOKEN, TELEGRAM_NOTIFICATION_CHANNEL } = process.env;



// Initialize the bot
const bot = new TelegramBot(BOT_TOKEN, { polling: false });



// Function to send a message to the channel
export function sendMessageToChannel(message: any) {
  return bot.sendMessage(TELEGRAM_NOTIFICATION_CHANNEL, message)

}


