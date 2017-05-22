import axios from 'axios';
import { JaroWinklerDistance } from 'natural';
import * as cheerio from 'cheerio';

import { Event } from './../models';

const DFO_EVENTS_TW_URL = 'https://forum.gamer.com.tw/Co.php?bsn=09895&sn=275192&subbsn=0';
const isCloselyMatch = async function (str1, str2) {
    /*
    let num = JaroWinklerDistance(`Can't Stop Becky [Extended]`, `Can't Stop Becky`);
    0.9185185185185185
    */
    return JaroWinklerDistance(str1, str2) > 0.85;
};
let PunctuationRegExpPattern = '\.\,\/\#\!\$\%\^\&\*\;\:\{\}\=\-\_\"\`\~\(\)\'';
let punctuationRegExp = new RegExp(`^([\\w\\s${PunctuationRegExpPattern}]+)`);
const parseEnglisthAndChineseEventNames = (text) => {
    let [_, englisthEventName] = punctuationRegExp.exec(text);
    text = text.replace(englisthEventName, '');
    let chineseName = text.split('showMediaClick("img")')[0].trim();
    return [englisthEventName, chineseName];
};



export async function CrawlDFOTWEvents() {
    let res = await axios.get(DFO_EVENTS_TW_URL);
    let articleWebPage = res.data;
    let $ = cheerio.load(articleWebPage);

    let eventTableElement = $('article#cf275192.FM-P2').find('table').get(1);
    $(eventTableElement).find('tr').each(async function (index, eventTableRowElement) {
        let [eventContentItemElement, eventLinkItemElement] = [0, 1].map(index => $(eventTableRowElement).find('td').get(index));
        let eventLinkElement = $(eventLinkItemElement).find('a').get(0);

        let eventItemText = $(eventContentItemElement).text().trim();
        let [englisthEventName, chineseEventName] = parseEnglisthAndChineseEventNames(eventItemText);

        let translationUrl = $(eventLinkElement).attr('href');

        await Event.searchAndUpdate(englisthEventName, { chineseName: chineseEventName, translationUrl: translationUrl });

    });
}


if (require.main === module) {
    CrawlDFOTWEvents();
}
