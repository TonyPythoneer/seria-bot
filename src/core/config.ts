import { resolve } from 'path';

const packageJson = require('./../../package.json');


// Host
const HOST_TYPE = {
    PRODUCTION: 'https://seria-bot.herokuapp.com',
    DEVELOPMENT: 'https://seria-bot-beta.herokuapp.com',
};
export const HOST = (() => {
    switch (process.env.NODE_ENV) {
        case 'production':
            return HOST_TYPE.PRODUCTION;
        case 'development':
            return HOST_TYPE.DEVELOPMENT;
        default:
            return HOST_TYPE.PRODUCTION;
    }
})();

// Directories
export const BASE_DIR = __dirname;
export const PROJECT_DIR = resolve(BASE_DIR, '..');
export const VIEWS_DIR = resolve(PROJECT_DIR, 'views');

// project info
export const VERSION: string = packageJson.version;

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
export const { SPREADSHEET_ID, SPEADSHEET_ID, GOOGLE_API_KEY } = process.env;
export const GOOGLE_SPEADSHEET_API = 'https://sheets.googleapis.com/v4/spreadsheets';
export const GOOGLE_SPEADSHEET_URL = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}`;

// Reids
const { REDIS_URL } = process.env;
export const REDIS_CONFIG = { path: REDIS_URL };

// MongoDB
export const { MONGODB_URI } = process.env;
