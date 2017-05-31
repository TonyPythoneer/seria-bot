import { Event } from './models';


async function main() {
    let events = await Event.listCurrentEvents();
    console.log(events);
}

main();
