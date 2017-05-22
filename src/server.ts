import * as express from 'express';

import { PORT } from './core/config';
import bot from './core/seria-bot';


const app = express();

const linebotParser = bot.parser();

app.post('/', linebotParser);


export function runServer() {
    const server = app.listen(PORT);
}
