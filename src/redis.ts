import * as redis from 'redis';

import { REDIS_CONFIG } from './config';


export default redis.createClient(REDIS_CONFIG);

