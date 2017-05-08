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
    present: { red: 1, green: 1, },
    unavailable: { red: 1 },
    absent: { red: 1, green: 1, blue: 1 },
};

let GoogleSpreadsheetApi = axios.create({
    baseURL: GOOGLE_SPEADSHEET_API
});

const NameAndJobRegx = new RegExp('(\.+)\\((\.+)\\)');
function getMembername(member: string) {
    let [original, name, job] = NameAndJobRegx.exec(member);
    return name;
}


function rollCallHandler(rows: any[]) {
    let slotNum = 0;
    let unavailableList = [];
    let absentList = [];
    for (let partyIndex = 0, length = rows.length; partyIndex < length; partyIndex++) {
        let row = rows[partyIndex];  // the row mean 4 members of party

        for (let memberIndex = 0, length = row.values.length; memberIndex < length; memberIndex++) {
            let value: any = row.values[memberIndex];
            let member: string = value.effectiveValue ? value.effectiveValue.stringValue : undefined;

            let bg = value.effectiveFormat ? value.effectiveFormat.backgroundColor : ATTENDANCE_STATUS.absent;
            let status = _.findKey(ATTENDANCE_STATUS, obj => _.isEqual(obj, bg));
            // console.log(member, status, bg);

            if (!!member && status === 'unavailable') {
                unavailableList.push(getMembername(member));  // 無法參加
            } else if (_.isUndefined(member) && status === 'absent') {
                slotNum += 1;  // 空位
            } else if (!!member && status === 'absent') {
                absentList.push(getMembername(member));  // 還未填寫
            }
        }
    }

    // console.log({ slotNum, unavailableList, absentList });

    return { slotNum, unavailableList, absentList };
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
        let res = currentValue;
        let msgList = [`${currentIndex + 1} 團：`];


        // O: 16 / X: 3 / -: 1
        /*
        let attendanceList = [];
        attendanceList.push(`O: ${20 - res.slotNum - res.unavailableList.length - res.absentList.length}`);
        if (res.unavailableList.length) attendanceList.push(`X: ${res.unavailableList.length}`);
        if (res.slotNum) attendanceList.push(`-: ${res.slotNum}`);
        let msg1 = `* 出缺席狀況： ${attendanceList.join(' / ')}`;
        msgList.push(msg1);
        */
        msgList.push(`* 可：共 ${20 - res.slotNum - res.unavailableList.length - res.absentList.length} 名`);


        // 不可名單
        let msg2 = '';
        if (res.unavailableList.length > 4) {
            msg2 = `* 不可：共 ${res.unavailableList.length} 名。省略。`;
            msgList.push(msg2);
        } else if (4 >= res.unavailableList.length && res.unavailableList.length > 0) {
            msg2 = `* 不可：共 ${res.unavailableList.length} 名。${res.unavailableList.join('、')}`;
            msgList.push(msg2);
        }

        // 未填寫名單
        let msg3 = '';
        if (res.absentList.length > 4) {
            msg3 = `* 未填寫：共 ${res.absentList.length} 名。省略。`;
            msgList.push(msg3);
        } else if (4 >= res.absentList.length && res.absentList.length > 0) {
            msg3 = `* 未填寫：共 ${res.absentList.length} 名。${res.absentList.join('、')}。`;
            msgList.push(msg3);
        }

        // 空位
        if (res.slotNum > 0) {
            msgList.push(`* 空位：共 ${res.slotNum} 個位子`);
        }

        return accumulator + msgList.join('\n') + '\n\n';
    }, '');
    return result;
}
