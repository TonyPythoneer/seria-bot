import { repeat, capitalize } from 'lodash';

const packageJson = require('./../package.json');
import * as api from './google-spreadsheet-api';



class Command {
    public regexp: RegExp;

    constructor(public name: string,
        public description: string,
        public func: (arg?: string) => Promise<string>) {
        this.regexp = new RegExp(`^${name}$`);
    }
}


const commands: Command[] = [
    new Command('seria help', '查詢指令', callHelp),
    new Command('seria health', '查詢賽麗亞是否正常服務', getHealth),
    new Command('seria version', '查詢賽麗亞的目前服務版本', getVersion),
    new Command('turtle query (wed|sat|sun)', '查詢團表出缺席狀況', queryTurtleSheet),
    new Command('turtle check (wed|sat|sun)', '查詢團表是否有誤', checkTurtleSheet),
];

async function callHelp() {
    let maxLength = commands.reduce((maxLength, command) => {
        let { name, description } = command;
        let length = name.length;
        return length > maxLength ? length : maxLength;
    }, 0);

    let lines = commands.map(command => {
        let { name, description } = command;
        let line = `* ${name} :${description}`;
        return line;
    });
    let message = lines.join('\n');

    return message;
}

async function getVersion() {
    const VERSION = packageJson.version;
    return `目前版本為 ${VERSION} 唷！`;
}

async function getHealth() {
    return `感謝冒險者您的關心，賽麗雅目前仍可以服務大家喔！`;
}

async function checkTurtleSheet(weekday) {
    weekday = capitalize(weekday);
    return await api.checkTable(weekday);
}

async function queryTurtleSheet(weekday) {
    weekday = capitalize(weekday);
    return await api.readTable(weekday);
}

export async function parseText(text: string) {
    for (let command of commands) {
        let regexpArray = command.regexp.exec(text);
        if (regexpArray !== null) {
            console.log(regexpArray);
            let arrayLength = regexpArray.length;
            if (arrayLength === 1) return await command.func();
            if (arrayLength === 2) return await command.func(regexpArray[1]);
        }
    }
    return null;
}
