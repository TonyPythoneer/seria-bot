import { repeat, capitalize } from 'lodash';

import { VERSION } from './../config';
import * as api from './../../google-spreadsheet-api';


class Command {
    public regexp: RegExp;

    constructor(public name: string,
        public description: string,
        public func: (arg?: string) => Promise<string>) {
        this.regexp = new RegExp(`^${name}$`);
    }
}

/*TODO
class ParentCommand {
    public regexp: RegExp;

    constructor(public name: string,
        public description: string,
        public func?: (arg?: string) => Promise<string>) {
        this.regexp = new RegExp(`^${name}`);
    }
}

class CommandGroup {
    constructor(public parent: ParentCommand,
        public childs?: Command[]) {
    }
}


const CommandPatterns = [
    new CommandGroup(new ParentCommand('help', '列出所有指令集')),
    new CommandGroup(new ParentCommand('seria', '賽麗亞為你提供 DNF 最新資訊')),
    new CommandGroup(new ParentCommand('turtle', '20 人烏龜團表資訊')),
];
*/


const commands: Command[] = [
    new Command('seria help', '列出指令', callHelp),
    new Command('seria health', '服務是否正常', getHealth),
    new Command('seria version', '目前版本', getVersion),
    new Command('turtle query (wed|sat|sun)', '列出團表出缺席狀況', queryTurtleSheet),
    new Command('turtle check (wed|sat|sun)', '團表是否有誤', checkTurtleSheet),
];

async function callHelp() {
    let maxLength = commands.reduce((maxLength, command) => {
        let { name, description } = command;
        let length = name.length;
        return length > maxLength ? length : maxLength;
    }, 0);

    let lines = commands.map(command => {
        let { name, description } = command;
        let line = `* ${name} -- ${description}`;
        return line;
    });
    let message = lines.join('\n');

    return message;
}

async function getVersion() {
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
