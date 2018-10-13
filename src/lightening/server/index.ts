import { createTradfriClient } from 'lightening/utils/tradfri';
import { readConfigFromEnv } from 'lightening/utils/config';
import { createConsoleLogger } from 'lightening/utils/logging';
import { createWebSocketServer } from 'lightening/utils/ws';

const log = createConsoleLogger();
const config = readConfigFromEnv();
const tradfri = createTradfriClient(config, log);
const server = createWebSocketServer(config, log);

tradfri.events.on('change', server.emitWorldState);
