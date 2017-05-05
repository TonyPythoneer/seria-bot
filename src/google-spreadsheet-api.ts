import { RecordWithTtl } from 'dns';
import axios from 'axios';
import * as _ from 'lodash';


const { SPEADSHEET_ID, GOOGLE_API_KEY } = process.env;
const GOOGLE_SPEADSHEET_API = 'https://sheets.googleapis.com/v4/spreadsheets';
const SHEETS = {
    Wed: '出團確認(三)',
    Sat: '出團確認(六)',
    Sun: '出團確認(日)',
};
const GROUPS = {
    first: 'B3:E7',
    second: 'B10:E14',
    third: 'B17:E21',
    fourth: 'H3:K7',
    fifth: 'H10:K14',
    sixth: 'H17:K21'
};
const ATTENDANCE_STATUS = {
    absent: { red: 1, green: 1, },
    present: { red: 1, green: 1, blue: 1 },
};


let GoogleSpreadsheetApi = axios.create({
    baseURL: GOOGLE_SPEADSHEET_API
});


function rollCallHandler(rows: any[]) {
    let results = [];
    for (let partyIndex = 0, length = rows.length; partyIndex < length; partyIndex++) {
        let row = rows[partyIndex];  // the row mean 4 members of party

        for (let memberIndex = 0, length = row.values.length; memberIndex < length; memberIndex++) {
            let value: any = row.values[memberIndex];
            let member: string = value.effectiveValue ? value.effectiveValue.stringValue : undefined;

            let bg = value.effectiveFormat ? value.effectiveFormat.backgroundColor : ATTENDANCE_STATUS.absent;
            let status = _.findKey(ATTENDANCE_STATUS, bg);

            if (status !== 'present') continue;
            if (_.isUndefined(member)) {
                results.push(`${partyIndex + 1} 隊的 ${memberIndex + 1}P 沒人`); // ex: 1 隊的 1P 沒人
            } else {
                results.push(`${member}還未填表`);  // ex: who（job）還未填表
            }
        }
    }
    return results;
}

function getGroups(res) {
    let data = res.data;
    let sheets: any[] = data.sheets;
    let sheet = sheets[0];
    let rows: any[] = sheet.data[0].rowData;  // there are 5 rows
    return rows;
}


async function getSomething() {
    let res = await GoogleSpreadsheetApi.get(`/${SPEADSHEET_ID}`, {
        params: {
            key: GOOGLE_API_KEY,
            includeGridData: true,
            ranges: `${SHEETS.Wed}!${GROUPS.first}`,
        }
    });

    let groups = getGroups(res);
    let results = rollCallHandler(groups);
}

export async function readTable(weekday: string) {
    let getConfig = (group) => ({
        params: {
            key: GOOGLE_API_KEY,
            includeGridData: true,
            ranges: `${SHEETS[weekday]}!${group}`,
        }
    });
    let requests = Object.keys(GROUPS).map(ordinal => {
        return GoogleSpreadsheetApi.get(`/${SPEADSHEET_ID}`, getConfig(GROUPS[ordinal]));
    });

    let responses = await axios.all(requests);
    let groupResponses = responses.map(getGroups);
    let resultsResponses = groupResponses.map(rollCallHandler);

    let result = resultsResponses.reduce((accumulator, currentValue, currentIndex, array) => {
        if (currentValue.length === 0) return accumulator;

        let content = currentValue.join('\n');
        let msg = `${currentIndex + 1} 團：\n${content}\n\n`;
        return accumulator + msg;
    }, '');
    return result;
}

// getSomething();
// readTable('Sat');
