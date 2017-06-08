import axios, { AxiosRequestConfig } from 'axios';
import * as qs from 'qs';
import * as _ from 'lodash';

import { STATUS } from './constants';
import * as constants from './constants';
import { Sheets, GroupSerialNumberCell, ValueRanges } from './types';
import { enumerate, getMembername, getRangeFormGroupSerialNumberCell, getTeamsFromGroup, parseCell } from './utilities';
import { GOOGLE_SPEADSHEET_URL, GOOGLE_API_KEY } from './../../core/config';


let request = axios.create({
    baseURL: GOOGLE_SPEADSHEET_URL
});

const TEST_SHEET = '新表格測試';

let paramsSerializer = params => qs.stringify(params, { arrayFormat: 'repeat' });


export const getAvailableGroupsStatus = async function () {
    let reqConfig: AxiosRequestConfig = {
        params: {
            key: GOOGLE_API_KEY,
            includeGridData: true,
            ranges: _.values(constants.GROUP_SERIAL_NUMBER_CELL).map(cell => `${TEST_SHEET}!${cell}`),
        },
        paramsSerializer,
    };
    try {
        let res = await request.get('', reqConfig);
        let data = res.data;
        let sheets: Sheets = data.sheets;
        let sheet = sheets[0];
        let columnDataArray = sheet.data;

        let groupsStatus = columnDataArray.reduce((prev, columnData, index) => {
            let rowData = columnData.rowData[0];
            let value = rowData.values[0];
            let backgroundColor = value.effectiveFormat.backgroundColor;
            let isOk = _.isEqual(backgroundColor, STATUS.YES);
            let groupSerialName = index + 1;
            prev[index + 1] = isOk;
            return prev;
        }, {} as { [k: number]: boolean });

        let availableGroupSerialNumberCell = constants.GROUP_SERIAL_NUMBER_CELL;
        // console.log(availableGroupsStatus);
        // console.log(groupsStatus);
        for (let groupSerialName in groupsStatus) {
            let status = groupsStatus[groupSerialName];
            if (!status) delete availableGroupSerialNumberCell[groupSerialName];
        }
        // console.log(availableGroupsStatus);
        return availableGroupSerialNumberCell;
    } catch (err) {
        console.log(err.response.data);
        console.log(err.message);
        console.log(err.config);
        throw err;
    }
};


export const queryAttendanceTableFromGroups = async function (sheetName: string = TEST_SHEET) {
    let availableGroupSerialNumberCell = await getAvailableGroupsStatus();
    let groupSerialNumberRange = getRangeFormGroupSerialNumberCell(availableGroupSerialNumberCell);
    console.log(groupSerialNumberRange);

    let makeReqConfig = (sheetName: string) => ({
        params: {
            key: GOOGLE_API_KEY,
            includeGridData: true,
            ranges: _.values(groupSerialNumberRange).map(cellRange => `${sheetName}!${cellRange}`),
        },
        paramsSerializer,
    });
    let res = await request.get('', makeReqConfig(sheetName));
    let data = res.data;
    let sheets: Sheets = data.sheets;
    let sheet = sheets[0];
    let columnDataArray = sheet.data;
    let groups = columnDataArray.map(data => {
        let rowDataArray = data.rowData;
        return rowDataArray.map(rowData => {
            return rowData;
        });
    });

    let result: {
        [k: number]: {
            unavailableMembers: string[];
            unfilledMembers: string[];
            slotCount: number;
        }
    } = {};
    for (let { index, item } of enumerate(Object.keys(groupSerialNumberRange))) {
        let groupSerialNumber = item;
        let unavailableMembers: string[] = [];
        let unfilledMembers: string[] = [];
        let slotCount: number = 0;
        let group = groups[index];

        for (let partyIndex = 0, length = group.length; partyIndex < length; partyIndex++) {
            let party = group[partyIndex];  // the row mean 4 members of party

            for (let memberIndex = 0, length = party.values.length; memberIndex < length; memberIndex++) {
                let value: any = party.values[memberIndex];
                let memberWithJob: string = value.effectiveValue ? value.effectiveValue.stringValue : undefined;
                // console.log(partyIndex, memberIndex, memberWithJob);
                if (memberWithJob === undefined) {
                    slotCount++;
                    continue;
                }

                let memberName = getMembername(memberWithJob);
                let bg = value.effectiveFormat ? value.effectiveFormat.backgroundColor : undefined;
                // console.log(bg);

                if (_.isEqual(bg, STATUS.NO)) {
                    unavailableMembers.push(memberName);
                } else if (_.isEqual(bg, STATUS.UNFILLED)) {
                    unfilledMembers.push(memberName);
                }
            }
        }
        result[groupSerialNumber] = { unavailableMembers, unfilledMembers, slotCount };
    }
    // console.log(result);
    return result;
};


export const checkRepeatMembersFromGroups = async function (sheetName: string = TEST_SHEET) {
    let availableGroupSerialNumberCell = await getAvailableGroupsStatus();
    let groupSerialNumberRange = getRangeFormGroupSerialNumberCell(availableGroupSerialNumberCell);
    console.log(groupSerialNumberRange);

    let reqConfig = {
        params: {
            key: GOOGLE_API_KEY,
            ranges: _.values(groupSerialNumberRange).map(cellRange => `${sheetName}!${cellRange}`),
            valueRenderOption: 'FORMULA',
            dateTimeRenderOption: 'SERIAL_NUMBER',
        },
        paramsSerializer,
    };

    interface Result {
        totalErrorMembers: string[];
        groupErrorInfo: [{
            groupSerialNumber: string;
            repeatGroupMembers: string[];
        }];
    }
    let result = {
        totalErrorMembers: [],
        groupErrorInfo: [],
    } as Result;


    //
    try {
        let res = await request.get(`/values:batchGet`, reqConfig);
        let data = res.data;
        let valueRanges: ValueRanges = data.valueRanges;
        let groups = valueRanges.map(valueRange => valueRange.values);

        let totalMembers = [];
        let totalErrorMembers = [];
        for (let { index, item } of enumerate(Object.keys(groupSerialNumberRange))) {
            let groupSerialNumber = item;
            let group = valueRanges[index].values;

            let groupMembers: string[] = [];
            let repeatGroupMembers: string[] = [];
            group.forEach(team => {
                team.forEach(memberWithJob => {
                    if (!memberWithJob) return;

                    if (totalMembers.indexOf(memberWithJob) !== -1) totalErrorMembers.push(memberWithJob);
                    totalMembers.push(memberWithJob);

                    let memberName = getMembername(memberWithJob);
                    if (groupMembers.indexOf(memberName) !== -1) repeatGroupMembers.push(memberName);
                    groupMembers.push(memberName);
                });

            });
            groupMembers = [];
            repeatGroupMembers = [];
            result.groupErrorInfo.push({ groupSerialNumber, repeatGroupMembers });
        }
        result.totalErrorMembers = totalErrorMembers;
        // console.log(result);
        return result;
    } catch (err) {
        console.log(err.response.data);
        console.log(err.message);
        console.log(err.config);
        throw err;
    }
};


export async function getUnjoinMembers(sheetName: string = TEST_SHEET) {
    let availableGroupSerialNumberCell = await getAvailableGroupsStatus();
    let groupSerialNumberRange = getRangeFormGroupSerialNumberCell(availableGroupSerialNumberCell);

    let reqConfig = {
        params: {
            key: GOOGLE_API_KEY,
            majorDimension: 'COLUMNS',
        }
    };
    let res: any = await request.get(`/values/${encodeURI('總表')}!A3:A`, reqConfig);
    let values = res.data.values;
    let list: string[] = values[0];
    let mamberNameList = list.filter(elem => !!elem);

    //
    let reqConfig2 = {
        params: {
            key: GOOGLE_API_KEY,
            ranges: _.values(groupSerialNumberRange).map(cellRange => `${sheetName}!${cellRange}`),
            valueRenderOption: 'FORMULA',
            dateTimeRenderOption: 'SERIAL_NUMBER',
        },
        paramsSerializer,
    };
    try {
        let res2 = await request.get(`/values:batchGet`, reqConfig2);
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

        let unjoinList = _.difference(mamberNameList, totalMembers);
        console.log(unjoinList);
        return { unjoinList };

    } catch (err) {
        console.log(err.response.data);
        console.log(err.message);
        console.log(err.config);
        throw err;
    }
}
