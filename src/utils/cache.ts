import Redis from 'ioredis';



const { REDIS_ENDPOINT, REDIS_PWD } = process.env
// create new cache instance
const client = new Redis(`redis://default:${REDIS_PWD}@${REDIS_ENDPOINT}:33708`);


function getStartOfCurrentDayISOString() {
  const now = new Date(); // Current date and time in local time
  const utcNow = new Date(now.getTime() + now.getTimezoneOffset() * 60000); // Convert to UTC
  const startOfDayUTC = new Date(Date.UTC(utcNow.getUTCFullYear(), utcNow.getUTCMonth(), utcNow.getUTCDate())); // Start of current day in UTC

  // Return ISO string of start of current day in UTC
  return startOfDayUTC.toISOString();
}


export const getKey = (channelId: string) => {
  const startOfDayISOString = getStartOfCurrentDayISOString();
  return `${channelId}#${startOfDayISOString}`
}

export default client