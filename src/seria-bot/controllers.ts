import * as express from 'express';

import { ExpressUrlpatterns } from './../lib/types';
import bot from './bot';


const router = express.Router();


router.route('/webhook').post(bot.parser());


const urlpatterns: ExpressUrlpatterns = { url: '/seria-bot', router };
export default urlpatterns;
