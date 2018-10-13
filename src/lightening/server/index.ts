import { createTradfriClient } from 'lightening/utils/tradfri';
import { readConfigFromEnv } from 'lightening/utils/config';
import { createConsoleLogger } from 'lightening/utils/logging';
import { createWebSocketServer } from 'lightening/utils/ws';
import { createWebServer } from 'lightening/utils/web';

const log = createConsoleLogger();
const config = readConfigFromEnv();
const tradfri = createTradfriClient(config, log);
const web = createWebServer(config, log);
const ws = createWebSocketServer(config, log);

web;

tradfri.events.on('change', ws.emitWorldState);
