import * as express from 'express';

import { Event } from './models';
import { ExpressUrlpatterns } from './../lib/types';


const router = express.Router();


router.route('/:hashcode')
    .get(async (req, res, next) => {
        let hashcode: string = req.params['hashcode'];
        let event = await Event.findOne({ hashcode });
        if (event) return res.redirect(event.translation_url);
        return res.status(404);
    });


const urlpatterns: ExpressUrlpatterns = { url: '/e', router };
export default urlpatterns;
