import * as cluster from 'cluster';
import * as express from 'express';
import { cpus } from 'os';

import { bot } from './seria';


const CPU_NUM = cpus().length;
const PORT = process.env.PORT || 8080;


if (cluster.isMaster) {
    console.log(`Web application server is running on port ${PORT} with ${CPU_NUM} CPUs`);

    for (let i = 0; i < CPU_NUM; i++) { cluster.fork(); }

    cluster.on('exit', (worker, code, signal) => {
        console.log(`worker ${worker.process.pid} died`);
    });
} else {
    const app = express();

    const linebotParser = bot.parser();
    app.post('/', linebotParser);

    const server = app.listen(PORT);

    console.log(`Worker ${process.pid} started`);
}
