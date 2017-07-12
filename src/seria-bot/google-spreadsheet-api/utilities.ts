import { Sheet, GroupSerialNumberCell } from './types';


// http://stackoverflow.com/questions/10179815/how-do-you-get-the-loop-counter-index-using-a-for-in-syntax-in-javascript/10179849#10179849
export function* enumerate<T>(iterable: T[]) {
    let index = 0;

    for (const item of iterable) {
        yield { index, item };
        index++;
    }
}


export function getMembername(member: string) {
    let name = member.split('(', 1).pop();
    return name;
}


/**
 * util
 */
export const getRangeFormGroupSerialNumberCell = function (availableGroupSerialNumberCell: GroupSerialNumberCell) {
    let movetoNewColumn = (baseColumn: string, shift: number) => String.fromCharCode(baseColumn.charCodeAt(0) + shift);
    let movetoNewRow = (baseRow: string, shift: number) => (Number(baseRow) + shift).toString();
    for (let groupSerialNumber in availableGroupSerialNumberCell) {
        let cell = availableGroupSerialNumberCell[groupSerialNumber];
        let [cellColumn, cellRow] = parseCell(cell);
        let [startColumn, startRow] = [movetoNewColumn(cellColumn, 1), movetoNewRow(cellRow, 1)];
        let [endColumn, endRow] = [movetoNewColumn(startColumn, 3), movetoNewRow(startRow, 4)];
        availableGroupSerialNumberCell[groupSerialNumber] = `${startColumn}${startRow}:${endColumn}${endRow}`;
    }
    return availableGroupSerialNumberCell;
};

/**
 * util
 */
export function getTeamsFromGroup(sheet: Sheet) {
    let columnDataArray = sheet.data;
    let rowDataArray = columnDataArray[0].rowData;
    return rowDataArray;
}

export const parseCell = (text: string) => {
    let cellRegExp = new RegExp('([a-zA-Z]+)([0-9]+)');
    let array = cellRegExp.exec(text);
    if (!array) return null;
    let [column, row] = array.slice(1);
    return [column, row];
};

export const range = (num: number) => Array.from(Array(num).keys());
