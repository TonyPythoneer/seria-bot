import { repeat, capitalize } from 'lodash';
import * as _ from 'lodash';

import * as api from './../google-spreadsheet-api';
import { HOST, VERSION } from './../../core/config';
import { Event } from './../../event/models';
import { CrawlDFOENEvents, CrawlDFOTWEvents } from './../../event/commands';


class Command {
    public regexp: RegExp;

    constructor(public name: string,
        public description: string,
        public func: (arg?: string) => Promise<string>) {
        this.regexp = new RegExp(`^${name}$`);
    }
}

/*TODOprocess.env.NODE_ENV;
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
    new Command('seria events', '列出活動', listEvents),
    new Command('seria events update', '手動更新活動', updateEvents),
    new Command('seria health', '服務是否正常', getHealth),
    new Command('seria version', '目前版本', getVersion),
    new Command('turtle query (wed|sat|sun)', '列出團表出缺席狀況', queryTurtleSheet),
    new Command('turtle check (wed|sat|sun)', '團表是否有誤', checkTurtleSheet),
    new Command('turtle query (wed|sat|sun) unjoin', '列出未加入該團的成員', queryUnjoinTurtleSheet),
];

async function callHelp() {
    let maxLength = commands.reduce((maxLength, command) => {
        let length = command.name.length;
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

async function listEvents() {
    let events = await Event.listCurrentEvents();
    if (events.length === 0) return '現在沒有活動！';
    let eventList = events.map(event => {
        if (!event.translation_url) {
            return `* name: ${event.english_name}\n* link: 還沒有中文翻譯連結\n`;
        } else {
            return `* name: ${event.chinese_name}\n* link: ${HOST}/e/${event.hashcode}\n`;
        }
    });
    return eventList.join('\n');
}

async function updateEvents() {
    await CrawlDFOENEvents();
    await CrawlDFOTWEvents();
    return '活動更新完成囉！';
}

async function getVersion() {
    return `目前版本為 ${VERSION} 唷！`;
}

async function getHealth() {
    return `感謝冒險者您的關心，賽麗雅目前仍可以服務大家喔！`;
}

async function checkTurtleSheet(weekday: string) {
    weekday = capitalize(weekday);
    let data = await api.checkRepeatMembersFromGroups(weekday);
    let { totalErrorMembers, groupErrorInfo } = data;
    let [totalErrorMemberCount, groupErrorInfoCount] = [totalErrorMembers.length, groupErrorInfo.length];

    if (totalErrorMemberCount === 0 && groupErrorInfoCount === 0) return '沒有任何重複安排的人員唷~！';

    let msgArray = [];
    if (totalErrorMemberCount !== 0) msgArray.push(`* 總表重複人物： ${totalErrorMembers.join(', ')}\n`);
    if (groupErrorInfoCount !== 0) {
        groupErrorInfo.forEach(info => {
            msgArray.push(`* ${info.groupSerialNumber} 團重複人物： ${info.repeatGroupMembers.join(', ')}\n`);
        });
    }
    let msg = msgArray.join('\n');
    return msg;
}


async function queryTurtleSheet(weekday: string) {
    weekday = _.capitalize(weekday);
    let attendanceTableFromGroups = await api.queryAttendanceTableFromGroups(weekday);
    console.log(attendanceTableFromGroups);

    if (_.isEqual(attendanceTableFromGroups, {})) return '團表還未啟用！';

    let groupAttendanceStatusList = Object.keys(attendanceTableFromGroups)
        .reduce((prev, groupSerialNumber) => {
            let groupInfo = attendanceTableFromGroups[groupSerialNumber];
            if (groupInfo.unavailableMembers.length === 0 &&
                groupInfo.unfilledMembers.length === 0 &&
                groupInfo.slotCount === 0) {
                prev.completeGroupList.push(groupSerialNumber);
            } else {
                prev.incompleteGroupList.push(groupSerialNumber);
            }
            return prev;
        }, { completeGroupList: [], incompleteGroupList: [] });

    let msgArray = [`* 已完成填表團隊： ${groupAttendanceStatusList.completeGroupList.join(', ')}\n`];
    if (groupAttendanceStatusList.incompleteGroupList.length !== 0) {
        msgArray.push(`* 未完成填表團隊：`);
        for (let groupSerialNumber of groupAttendanceStatusList.incompleteGroupList) {
            let groupInfo = attendanceTableFromGroups[groupSerialNumber];
            let { unavailableMembers, unfilledMembers, slotCount } = groupInfo;
            let incompleteMsgArray = [`  * ${groupSerialNumber} 團：`];

            let unavailableMemberCount = unavailableMembers.length;
            if (unavailableMemberCount !== 0) {
                let unavailableMembersString = unavailableMemberCount <= 4 ? unavailableMembers.join(', ') : '省略';
                incompleteMsgArray.push(`    * 不可：${unavailableMemberCount}。${unavailableMembersString}。`);
            }

            let unfilledMemberCount = unfilledMembers.length;
            if (unfilledMemberCount !== 0) {
                let unfilledMembersString = unfilledMemberCount <= 4 ? unfilledMembers.join(', ') : '省略';
                incompleteMsgArray.push(`    * 未填：${unfilledMemberCount}。${unfilledMembersString}。`);
            }

            if (slotCount !== 0) incompleteMsgArray.push(`    * 空位：${slotCount}。`);

            msgArray.push(`${incompleteMsgArray.join('\n')}\n`);
        }
    }
    return msgArray.join('\n');
}


async function queryUnjoinTurtleSheet(weekday: string) {
    weekday = capitalize(weekday);
    let data = await api.getUnjoinMembers(weekday);
    let msg = `* 未出席名單：\n${data.unjoinList.join(', ')}`;
    return msg;
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
