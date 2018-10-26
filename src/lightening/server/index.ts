import { createTradfriClient } from 'lightening/shared/utils/tradfri';
import { readConfigFromEnv } from 'lightening/shared/utils/config';
import { createConsoleLogger } from 'lightening/shared/utils/logging';
import { createWebSocketServer } from 'lightening/shared/utils/ws';
import { createWebServer } from 'lightening/shared/utils/web';

const log = createConsoleLogger();
const config = readConfigFromEnv();
const tradfri = createTradfriClient(config, log);
const web = createWebServer(config, log);
const ws = createWebSocketServer(config, tradfri, log);

web;

tradfri.events.on('change', ws.emitWorldState);

// https://github.com/remy/nodemon/issues/1025#issuecomment-308049864
process.on('SIGINT', () => {
  log.info('Shutting down gracefully...');
  setTimeout(() => process.exit(), 100);
});
