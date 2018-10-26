import WebSocket from 'ws';
import { NO_LOGGING } from 'lightening/utils/logging';
import { Config } from 'lightening/utils/config';
import { createTradfriClient } from 'lightening/utils/tradfri';
import { ServerState } from 'lightening/model/state';

export function createWebSocketServer(
  config: Config,
  tradfri: ReturnType<typeof createTradfriClient>,
  log = NO_LOGGING,
) {
  const wss = new WebSocket.Server({ port: config.LIGHTENING_WEBSOCKET_PORT });

  let connections: WebSocket[] = [];
  let latest: ServerState | null = null;

  wss.on('connection', ws => {
    log.info('Client connected');

    connections.push(ws);
    log.debug(`Current connection count: ${connections.length}`);

    if (latest) emitWorldState(ws, latest);

    ws.on('message', message => {
      log.debug('Message from client', message);
      try {
        const parsed = JSON.parse(message + '');
        if (typeof parsed.toggleLight === 'number') {
          log.info('Will toggle light:', parsed.toggleLight);
          tradfri
            .toggleLight(parsed.toggleLight)
            .then(res => log.info('Light toggle succeeded', res), err => log.warn('Light toggle failed', err));
        } else if (typeof parsed.toggleGroup === 'number') {
          log.info('Will toggle group:', parsed.toggleGroup);
          tradfri
            .toggleGroup(parsed.toggleGroup)
            .then(res => log.info('Group toggle succeeded', res), err => log.warn('Group toggle failed', err));
        } else if (typeof parsed.setGroup === 'number') {
          log.info(`Will set group ${parsed.setOn ? 'ON' : 'OFF'}:`, parsed.setGroup);
          tradfri
            .setGroup(parsed.setGroup, parsed.setOn)
            .then(res => log.info('Group toggle succeeded', res), err => log.warn('Group toggle failed', err));
        } else {
          log.warn('Received well-formed but non-standard message from client');
        }
      } catch (err) {
        log.warn('Received malformed message from client');
      }
    });

    ws.on('close', (code, reason) => {
      log.info('Client disconnected', { code, reason });
      connections = connections.filter(connection => connection !== ws);
      log.debug(`Current connection count: ${connections.length}`);
    });
  });

  return {
    emitWorldState(newWorldState: ServerState) {
      latest = newWorldState;
      connections.forEach(connection => emitWorldState(connection, newWorldState));
    },
  };

  function emitWorldState(ws: WebSocket, state: ServerState) {
    ws.send(JSON.stringify({ type: 'WORLD_STATE_UPDATE', state }, null, 2));
  }
}
