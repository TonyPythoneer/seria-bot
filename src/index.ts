import * as express from 'express';
import LineBot = require('linebot');
const packageJson = require('./../package.json');
import * as api from './google-spreadsheet-api';
import * as _ from 'lodash';

const VERSION = packageJson.version;

const { CHANNEL_ID, CHANNEL_SECRET, CHANNEL_ACCESS_TOKEN } = process.env;

let bot = LineBot({
    channelId: CHANNEL_ID,
    channelSecret: CHANNEL_SECRET,
    channelAccessToken: CHANNEL_ACCESS_TOKEN
});

interface Event {
    type: string;
    replyToken: string;
    source: {
        userId: string;
        type: string;
        profile: Function[];
    };
    timestamp: Number;
    message: {
        type: string;
        id: string;
        text: string;
        content: Function[];
    };
    reply: (kind: string) => Promise<string>;
}


bot.on('join', (event: Event) => {
    event.reply('你好啊！冒險者');
});


bot.on('leave', (event: Event) => {
    event.reply('再見了！冒險者');
});


function turtleCheckerHandler(command: string[]) {
    switch (command[0]) {
        case 'uncheck':
            break;
        default:
            break;
    }
}


async function turtleHandler(event: Event, command: string[]) {
    switch (command[0]) {
        case 'sun':
        case 'sat':
        case 'wed':
            let weekday = _.capitalize(command[0]);
            let content = await api.readTable(weekday);
            await event.reply(content);
            break;
        default:
            break;
    }
}


bot.on('message', (event: Event) => {
    let command = event.message.text.split(' ');
    console.log(event.message.text);
    console.log(command);
    let length = command.length;
    if (length < 1) return;
    if (command[0] === 'seria') command = command.splice(1, length);

    switch (command[0]) {
        case 'help':
            event.reply('此功能開發中！');
            break;
        case 'turtle':
            turtleHandler(event, command.splice(1, command.length));
            break;
        case 'version':
            event.reply(`目前版本為 ${VERSION} 唷！`);
            break;
        default:
            break;
    }
});


/**
 * Application server
 */
const app = express();
const linebotParser = bot.parser();
app.post('/', linebotParser);

const server = app.listen(process.env.PORT || 8080, function () {
    let port = server.address().port;
    console.log('App now running on port', port);
});
