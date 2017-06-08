// types
export type Content = string | number;

export interface Value {
    userEnteredValue: { stringValue: Content };
    effectiveValue: { stringValue: Content };
    formattedValue: Content;
    userEnteredFormat: {
        userEnteredFormat: {
            backgroundColor: BackgroundColor;
        };
    };
    effectiveFormat: {
        backgroundColor: {
            red: number;
            green: number;
            blue: number;
        };
    };
}

export interface BackgroundColor {
    red: number;
    green: number;
    blue: number;
}

export interface RowData {
    values: Value[];
}


export interface ColumnData {
    startRow: number;
    rowData: RowData[];
}


export interface Sheet {
    properties: object;
    data: ColumnData[];
}

export type Sheets = Sheet[];


export interface IncludeGridDataResponse {
    sheets: Sheets;
}


export interface GroupSerialNumberCell {
    [key: number]: string;
}


export interface ValueRange {
    range: string;
    majorDimension: string;
    values: string[][];
}
export type ValueRanges = ValueRange[];
