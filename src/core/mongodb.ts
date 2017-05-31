import * as Bluebird from 'bluebird';
import { connect, createConnection, ConnectionOptions } from 'mongoose';

import { MONGODB_URI } from './config';


const mongodbConnection = createConnection(MONGODB_URI, { promiseLibrary: Bluebird });
mongodbConnection.on('connected', () => {
    console.log('Mongoose connection: connected');
});
mongodbConnection.on('error', err => {
    throw err;
});
export default mongodbConnection;
