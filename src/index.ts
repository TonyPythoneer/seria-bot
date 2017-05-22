import 'bluebird-ployfill';

import * as cluster from 'cluster';
import * as express from 'express';
import { cpus } from 'os';

import { PORT } from './core/config';
import { connectMongoDB } from './core/mongodb';
import { runServer } from './server';


const CPU_NUM = cpus().length;


if (cluster.isMaster) {
    console.log(`Web application server is running on port ${PORT} with ${CPU_NUM} CPUs`);
    for (let i = 0; i < CPU_NUM; i++) cluster.fork();

    connectMongoDB();

    cluster.on('exit', (worker, code, signal) => {
        console.log(`worker ${worker.process.pid} died`);
    });
} else {
    runServer();
}
