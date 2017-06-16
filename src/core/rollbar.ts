import * as Rollbar from 'rollbar';

import { ROLLBAR_ACCESS_TOKEN } from './config';


const rollbar = new Rollbar({
    accessToken: ROLLBAR_ACCESS_TOKEN,
    handleUncaughtExceptions: true,
    handleUnhandledRejections: true
});

export default rollbar;
