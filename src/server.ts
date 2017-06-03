import * as express from 'express';
import * as path from 'path';

import { PORT, PROJECT_DIR } from './core/config';
import bot from './core/seria-bot';
import { ExpressUrlpatterns } from './lib/types';


function importExpressUrlpatterns(appname: string) {
    let appdir = path.resolve(PROJECT_DIR, appname, 'controllers');
    let urlpatterns: ExpressUrlpatterns = require(appdir).default;
    return urlpatterns;
}


const EXPRESS_APPS = [
    'event'
];
const app = express();

app.post('/', bot.parser());
EXPRESS_APPS.forEach(appname => {
    let urlpatterns = importExpressUrlpatterns(appname);
    if (urlpatterns) {
        let { url, router } = urlpatterns;
        app.use(url, router);
        // if (DEBUG) console.log(`  * ${appname}: ${url}`)
    }
});


export function runServer() {
    const server = app.listen(PORT);
}
