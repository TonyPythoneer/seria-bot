import * as EventEmitter from 'events';

class MyEmitter extends EventEmitter { }


export const BotEvents = {

};

export const myEmitter = new MyEmitter();
myEmitter.on('event', () => {
    console.log('an event occurred!');
});
