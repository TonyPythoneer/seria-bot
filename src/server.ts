import * as express from 'express';

import { PORT } from './config';
import { bot } from './seria';


const app = express();

const linebotParser = bot.parser();

app.post('/', linebotParser);


export function runServer() {
    const server = app.listen(PORT);
}
