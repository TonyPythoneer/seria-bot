import * as express from 'express';
import * as path from 'path';

import { PORT, PROJECT_DIR } from './core/config';
import rollbar from './core/rollbar';
import { ExpressUrlpatterns } from './lib/types';


function importExpressUrlpatterns(appname: string) {
    let appdir = path.resolve(PROJECT_DIR, appname, 'controllers');
    let urlpatterns: ExpressUrlpatterns = require(appdir).default;
    return urlpatterns;
}


function createApplicationServer() {
    const app = express();
    const EXPRESS_APPS = [
        'event',
        'seria-bot',
    ];

    for (let appname of EXPRESS_APPS) {
        let urlpatterns = importExpressUrlpatterns(appname);
        if (urlpatterns) {
            let { url, router } = urlpatterns;
            app.use(url, router);
            console.log(`Install express app: ${appname}, ${url}`);
        }
    }

    // Use the rollbar error handler to send exceptions to your rollbar account
    app.use(rollbar.errorHandler());

    return app;
}


export function runServer() {
    const app = createApplicationServer();
    const server = app.listen(PORT);
}
