import axios from 'axios';
import * as _ from 'lodash';
import * as qs from 'qs';

import * as config from './../core/config';


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
const STATUS = {
    yes: { red: 1, green: 1, },  // yellow
    no: { red: 1 },  // red
    unfilled: { red: 1, green: 1, blue: 1 },  // white
};

const ATTENDANCE_STATUS = {
    present: { red: 1, green: 1, },
    unavailable: { red: 1 },
    absent: { red: 1, green: 1, blue: 1 },
};


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


let GoogleSpreadsheetApi = axios.create({
    baseURL: config.GOOGLE_SPEADSHEET_API
});


export async function readTable(weekday: string) {
    let getConfig = (group) => ({
        params: {
            key: config.GOOGLE_API_KEY,
            includeGridData: true,
            ranges: `${SHEETS[weekday]}!${group}`,
        }
    });
    let requests = Object.keys(GROUPS).map(ordinal => {
        return GoogleSpreadsheetApi.get(`/${config.SPEADSHEET_ID}`, getConfig(GROUPS[ordinal]));
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


/**
 *
 * @param weekday
 */
interface ValueRange {
    range: string;
    majorDimension: string;
    values: any[][];
}
type ValueRanges = ValueRange[];


// http://stackoverflow.com/questions/10179815/how-do-you-get-the-loop-counter-index-using-a-for-in-syntax-in-javascript/10179849#10179849
function* enumerate<T>(iterable: T[]) {
    let index = 0;

    for (const item of iterable) {
        yield { index, item };
        index++;
    }
}

export async function checkTable(weekday: string) {
    // https://developers.google.com/sheets/api/samples/reading
    // Read multiple ranges

    let reqConfig = {
        params: {
            key: config.GOOGLE_API_KEY,
            ranges: Object.keys(GROUPS).map(key => `${SHEETS[weekday]}!${GROUPS[key]}`),
            valueRenderOption: 'FORMULA',
            dateTimeRenderOption: 'SERIAL_NUMBER',
        },
        paramsSerializer: params => qs.stringify(params, { arrayFormat: 'repeat' }),
    };

    let totalMembers = [];
    let totalErrorMembers = [];
    let groupMembers = [];
    let groupErrorMembers = [];
    let totalErrorMsg = '';
    let groupErrorMsg = '';

    try {
        let res = await GoogleSpreadsheetApi.get(`/${config.SPEADSHEET_ID}/values:batchGet`, reqConfig);
        let data = res.data;
        let valueRanges: ValueRanges = data.valueRanges;

        for (let elem of enumerate(valueRanges)) {
            let groupIndex = elem.index;
            let group = valueRanges[groupIndex].values;

            for (let elem of enumerate(group)) {
                let partyIndex = elem.index;
                let party = group[partyIndex];

                for (let elem of enumerate(party)) {
                    let memberIndex = elem.index;
                    let member = party[memberIndex];

                    if (!member) continue;

                    if (totalMembers.indexOf(member) !== -1) totalErrorMembers.push(member);
                    totalMembers.push(member);

                    let membername = getMembername(member);
                    if (groupMembers.indexOf(membername) !== -1) groupErrorMembers.push(membername);
                    groupMembers.push(membername);
                }
            }

            // console.log(groupMembers);

            // console.log(groupErrorMembers);
            if (groupErrorMembers.length > 0) {
                groupErrorMsg += `* 第 ${groupIndex + 1} 團: ${groupErrorMembers.join('、')}\n`;
            }
            groupErrorMembers = [];
            groupMembers = [];
        }

        // console.log(totalMembers);
        // console.log(totalErrorMembers);
        if (totalErrorMembers.length > 0) {
            totalErrorMsg += `* 總表重複人物: ${totalErrorMembers.join('、')}\n`;
        }

        if (totalErrorMsg === '' && groupErrorMsg === '') return '沒有任何重複安排的人員唷~！';

        let finalMsgList = [];
        if (totalErrorMsg !== '') finalMsgList.push(totalErrorMsg);
        if (groupErrorMsg !== '') finalMsgList.push(groupErrorMsg);
        return finalMsgList.join('\n');

    } catch (e) {
        console.log(e);
        return '阿拉德大陸出事了！請通知管理員！';
    }
}


export async function getUnjoinMembers(weekday: string) {
    //
    let reqConfig = {
        params: {
            key: config.GOOGLE_API_KEY,
            majorDimension: 'COLUMNS',
        }
    };
    let res: any = await GoogleSpreadsheetApi.get(`/${config.SPEADSHEET_ID}/values/${encodeURI('總表')}!A3:A`, reqConfig);
    let values = res.data.values;
    let list: string[] = values[0];
    let nameList = list.filter(elem => !!elem);

    //
    let reqConfig2 = {
        params: {
            key: config.GOOGLE_API_KEY,
            ranges: Object.keys(GROUPS).map(key => `${SHEETS[weekday]}!${GROUPS[key]}`),
            valueRenderOption: 'FORMULA',
            dateTimeRenderOption: 'SERIAL_NUMBER',
        },
        paramsSerializer: params => qs.stringify(params, { arrayFormat: 'repeat' }),
    };
    try {
        let res2 = await GoogleSpreadsheetApi.get(`/${config.SPEADSHEET_ID}/values:batchGet`, reqConfig2);
        let data = res2.data;
        let valueRanges: ValueRanges = data.valueRanges;
        let totalMembers = [];
        let totalErrorMembers = [];

        for (let elem of enumerate(valueRanges)) {
            let groupIndex = elem.index;
            let group = valueRanges[groupIndex].values;

            for (let elem of enumerate(group)) {
                let partyIndex = elem.index;
                let party = group[partyIndex];

                for (let elem of enumerate(party)) {
                    let memberIndex = elem.index;
                    let member = party[memberIndex];

                    if (!member) continue;


                    let membername = getMembername(member);
                    if (totalMembers.indexOf(membername) === -1) totalMembers.push(membername);

                }
            }
        }

        let unjoinList = _.difference(nameList, totalMembers);
        console.log(`* 未出席名單：\n${unjoinList.join(', ')}`);
        return `* 未出席名單：\n${unjoinList.join(', ')}`;

    } catch (err) {
        console.log(err);
        return '阿拉德大陸出事了！請通知管理員！';
    }
}
