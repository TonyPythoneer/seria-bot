import * as express from 'express';


export interface ExpressUrlpatterns {
    url: string;
    router: express.Router;
}
