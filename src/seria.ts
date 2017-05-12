import LineBot = require('linebot');
const packageJson = require('./../package.json');
import * as api from './google-spreadsheet-api';
import * as _ from 'lodash';

import { LINE_BOT_CONFIG, VERSION } from './config';


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

export let bot = LineBot(LINE_BOT_CONFIG);


bot.on('join', (event: Event) => {
    event.reply('你好啊！冒險者');
});


bot.on('leave', (event: Event) => {
    event.reply('再見了！冒險者');
});


bot.on('message', (event: Event) => {
    if (event.message.type !== 'text') return;
    let text = event.message.text.toLowerCase();
    let command = text.split(' ');
    console.log(event.message.text);
    console.log(command);
    let length = command.length;
    if (length < 1) return;
    if (command[0] === 'seria') command = command.splice(1, length);

    switch (command[0]) {
        case 'help':
            event.reply([
                '目前賽麗亞能接受的指令如下：',
                '* seria help -- 查詢指令',
                '* seria turtle [weekday] -- 查詢團表, weekday: wed/sat/sun',
                '* seria turtle [weekday] check -- 查詢團隊是否安排有誤',
                '* seria health -- 查詢賽麗亞是否正常服務',
                '* seria version -- 查詢賽麗亞的目前服務版本',
            ].join('\n'));
            break;
        case 'turtle':
            turtleHandler(event, command.splice(1, command.length));
            break;
        case 'health':
            event.reply(`感謝冒險者您的關心，賽麗雅目前仍可以服務大家喔！`);
            break;
        case 'version':
            event.reply(`目前版本為 ${VERSION} 唷！`);
            break;
        default:
            break;
    }
});


async function turtleHandler(event: Event, command: string[]) {
    switch (command[0]) {
        case 'sun':
        case 'sat':
        case 'wed':
            let weekday = _.capitalize(command[0]);
            if (command[1] === 'check') {
                let content = await api.checkTable(weekday);
                await event.reply(content);
            } else {
                let content = await api.readTable(weekday);
                await event.reply(content);
            }
            break;
        default:
            break;
    }
}
