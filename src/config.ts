const packageJson = require('./../package.json');


// project info
export const VERSION = packageJson.version;

// web application server
export const PORT = process.env.PORT || 8080;

// line bot config
const { CHANNEL_ID, CHANNEL_SECRET, CHANNEL_ACCESS_TOKEN } = process.env;
export const LINE_BOT_CONFIG = {
    channelId: CHANNEL_ID,
    channelSecret: CHANNEL_SECRET,
    channelAccessToken: CHANNEL_ACCESS_TOKEN
};

// Google application
export const { SPEADSHEET_ID, GOOGLE_API_KEY } = process.env;
export const GOOGLE_SPEADSHEET_API = 'https://sheets.googleapis.com/v4/spreadsheets';

//
export const { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD } = process.env;
export const REDIS_CONFIG = {
    host: REDIS_HOST,
    port: REDIS_PORT,
    password: REDIS_PASSWORD,
};
