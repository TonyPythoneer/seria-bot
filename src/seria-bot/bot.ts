import * as LineBot from 'linebot';
import * as _ from 'lodash';

import { LINE_BOT_CONFIG, VERSION } from './../core/config';
import * as api from './google-spreadsheet-api';
import { parseText } from './scenarios';


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

let bot = LineBot(LINE_BOT_CONFIG);


bot.on('join', (event: Event) => {
    event.reply('你好啊！冒險者');
});


bot.on('leave', (event: Event) => {
    event.reply('再見了！冒險者');
});


bot.on('message', async function (event: Event) {
    if (event.message.type !== 'text') return;
    let text = event.message.text.toLowerCase();
    let message = await parseText(text);
    if (message) event.reply(await message);
});

export default bot;
