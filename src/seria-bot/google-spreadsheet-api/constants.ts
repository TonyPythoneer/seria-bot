import { parseCell, range } from './utilities';
import { GroupSerialNumberCell } from './types';


export const SHEETS = {
    Wed: '出團確認(三)',
    Sat: '出團確認(六)',
    Sun: '出團確認(日)',
};


const COLOR_TYPE = {
    YELLOW: { red: 1, green: 1, },
    RED: { red: 1 },
    WHITE: { red: 1, green: 1, blue: 1 },
};
export const STATUS = {
    YES: COLOR_TYPE.YELLOW,
    NO: COLOR_TYPE.RED,
    UNFILLED: COLOR_TYPE.WHITE,
};


const GROUP_SHEET_INFO = {
    BASE_GROUP_NUMBER_CELL: 'A2',
    ROWS: 4,
    COLUMNS: 3,
    DIFF_ROW: 7,
    DIFF_COLUMN: 6,
};

export const GROUP_SERIAL_NUMBER_CELL = (() => {
    let [baseColumn, baseRow] = parseCell(GROUP_SHEET_INFO.BASE_GROUP_NUMBER_CELL);
    let [columnArray, rowArray] = [GROUP_SHEET_INFO.COLUMNS, GROUP_SHEET_INFO.ROWS].map(range);
    let getNewColumn = (index: number, diff: number) => String.fromCharCode(baseColumn.charCodeAt(0) + index * diff);
    let getNewRow = (index: number, diff: number) => (Number(baseRow) + index * diff).toString();

    let result: GroupSerialNumberCell = {};
    let count = 1;
    for (let columnIndex of columnArray) {
        for (let rowIndex of rowArray) {
            let newColumn = getNewColumn(columnIndex, GROUP_SHEET_INFO.DIFF_COLUMN);
            let newRow = getNewRow(rowIndex, GROUP_SHEET_INFO.DIFF_ROW);
            result[count] = `${newColumn}${newRow}`;
            count += 1;
        }
    }
    return result;
})();
