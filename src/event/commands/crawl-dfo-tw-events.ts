import axios from 'axios';
import * as cheerio from 'cheerio';

import { Event } from './../models';

const DFO_EVENTS_TW_URL = 'https://forum.gamer.com.tw/C.php?bsn=09895&snA=48320&tnum=4';


export async function CrawlDFOTWEvents() {
    let res = await axios.get(DFO_EVENTS_TW_URL);
    let articleWebPage = res.data;
    let $ = cheerio.load(articleWebPage);

    let eventTableElement = $('article.FM-P2').find('table').get(2);
    $(eventTableElement).find('tr').each(async function (index, eventTableRowElement) {
        let [eventContentItemElement, eventLinkItemElement] = [0, 1].map(index => $(eventTableRowElement).find('td').get(index));
        let eventLinkElement = $(eventLinkItemElement).find('a').get(0);

        let eventItemText = $(eventContentItemElement).text().trim();
        let chineseEventNameElement = $(eventContentItemElement).find('b').get(0);

        let chineseEventName = $(chineseEventNameElement).text().trim();
        let englishEventName = eventItemText.split(chineseEventName)[0].trim();
        let translationUrl = $(eventLinkElement).attr('href');

        // console.log(englisthEventName, chineseEventName, translationUrl);

        await Event.findEventAndUpdate(englishEventName, { chineseName: chineseEventName, translationUrl: translationUrl });

    });
}


async function main() {
    await CrawlDFOTWEvents();
    // that should use eventlistener to close proess
}


if (require.main === module) {
    main();
}
