import axios from 'axios';
import * as cheerio from 'cheerio';

import { Event, EventProperties } from './../models';

const DFO_EVENTS_URL = 'http://www.dfoneople.com/news/events';
const DateRegExpPattern = '([\\d]{4}-[\\d]{2}-[\\d]{2})';
const dateRegExp = new RegExp(`${DateRegExpPattern} ~ ${DateRegExpPattern}`);
const parseDate = (text) => {
    let [_, startDateText, endDateText] = dateRegExp.exec(text);
    return [startDateText, endDateText].map(text => new Date(text));
};


export async function CrawlDFOENEvents() {
    let res = await axios.get(DFO_EVENTS_URL);
    let eventsWebPage = res.data;

    let $ = cheerio.load(eventsWebPage);
    let eventsElement = $('div.thum_lst').find('ul');
    if (eventsElement.length === 0) return;
    eventsElement.each(async function (index, eventElement) {
        let eventContentElement = $(eventElement).find('li.cont').get(0);
        let $eventContentElement = $(eventContentElement);

        let [eventNameText, eventDateText] = ['p', 'p.date'].map(selector => {
            let eventInfoElement = $eventContentElement.find(selector).get(0);
            let eventInfoText = $(eventInfoElement).text().trim();
            return eventInfoText;
        });
        let [startAt, endAt] = parseDate(eventDateText);
        await Event.createEvent(eventNameText, startAt, endAt);
    });
}


async function main() {
    await CrawlDFOENEvents();
    // that should use eventlistener to close proess
}


if (require.main === module) {
    main();
}
