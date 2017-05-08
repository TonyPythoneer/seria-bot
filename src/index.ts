import * as express from 'express';
import { bot } from './seria';
import * as cluster from 'cluster';
import { cpus } from 'os';


const numCPUs = cpus().length;


if (cluster.isMaster) {
    console.log(`Master ${process.pid} is running`);

    for (let i = 0; i < numCPUs; i++) { cluster.fork(); }

    cluster.on('exit', (worker, code, signal) => {
        console.log(`worker ${worker.process.pid} died`);
    });
} else {
    const app = express();
    const linebotParser = bot.parser();
    app.post('/', linebotParser);

    const server = app.listen(process.env.PORT || 8080, function () {
        let port = server.address().port;
        console.log(`* Application is running on port ${port}'`);
    });

    console.log(`Worker ${process.pid} started`);
}
