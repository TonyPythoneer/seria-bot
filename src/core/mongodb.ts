import * as Bluebird from 'bluebird';
import { connect, ConnectionOptions } from 'mongoose';

import { MONGODB_URI } from './config';


export const connectMongoDB = async function () {
    const ConnectionOptions: ConnectionOptions = { promiseLibrary: Bluebird };
    try {
        await connect(MONGODB_URI, ConnectionOptions);
        console.log('Mongoose connection: Connected successful');
    } catch (err) {
        console.log(`Mongoose connection: Connected failed ${err}`);
        throw err;
    }
};
