import * as program from 'commander';
const packageJson = require('./../../package.json');


const VERSION = packageJson.version;


program
    .version(VERSION)
    .command('install [name]', 'install one or more packages')
    .command('search [query]', 'search with optional query')
    .command('list', 'list packages installed', { isDefault: true })
    .parse(process.argv);
