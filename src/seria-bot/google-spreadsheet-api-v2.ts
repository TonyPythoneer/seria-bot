import axios from 'axios';
import * as _ from 'lodash';
import * as qs from 'qs';

import * as config from './../core/config';


const SHEETS = {
    Wed: '出團確認(三)',
    Sat: '出團確認(六)',
    Sun: '出團確認(日)',
};

const GROUP_TABLE_INFO = {
    BASE_CELL: 'A2',
    ROWS: 4,
    COLUMNS: 3,
    DIFF_ROW: 7,
    DIFF_COLUMN: 7,
};

const parseCell = (text) => {
    const cellRegExp = new RegExp('([a-zA-Z])([0-9])');
    let array = cellRegExp.exec(text);
    if (!array) return null;
    let [column, row] = array.slice(1);
    return [column, row];
};
const range = (num: number) => Array.from(Array(num - 1).keys());


const GROUP_TABLE = (() => {
    let table: { [key: number]: string } = {};
    let [baseColumn, baseRow] = parseCell(GROUP_TABLE_INFO.BASE_CELL);
    let [columnArray, rowArray] = [GROUP_TABLE_INFO.COLUMNS, GROUP_TABLE_INFO.ROWS].map(range);
    let count = 1;

    let getNewColumn = (index: number, diff: number) => String.fromCharCode(baseColumn.charCodeAt(0) + index * diff);
    let getNewRow = (index: number, diff: number) => (Number(baseRow) + index * diff).toString();

    for (let columnIndex of columnArray) {
        for (let rowIndex of rowArray) {
            let newColumn = getNewColumn(columnIndex, GROUP_TABLE_INFO.DIFF_COLUMN);
            let newRow = getNewRow(rowIndex, GROUP_TABLE_INFO.DIFF_ROW);
            table[count] = `${newColumn}${newRow}`;
            count += 1;
        }
    }
    return table;
})();

console.log(GROUP_TABLE);
