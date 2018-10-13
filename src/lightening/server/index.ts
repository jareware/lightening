import WebSocket from 'ws';
import { createTradfriClient } from 'lightening/utils/tradfri';
import { readConfigFromEnv } from 'lightening/utils/config';
import { createConsoleLogger } from 'lightening/utils/logging';

const log = createConsoleLogger();
const tradfri = createTradfriClient(readConfigFromEnv(), log);
const wss = new WebSocket.Server({ port: 8080 });

tradfri.events.on('change', newWorldState => {
  log.debug('New world state:', newWorldState);
});

wss.on('connection', ws => {
  ws.on('message', message => {
    console.log('received: %s', message);
  });
  ws.send('something');
});
