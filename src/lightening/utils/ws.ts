import WebSocket from 'ws';
import { WorldState } from 'lightening/utils/model';
import { NO_LOGGING } from 'lightening/utils/logging';
import { Config } from 'lightening/utils/config';

export function createWebSocketServer(config: Config, log = NO_LOGGING) {
  const wss = new WebSocket.Server({ port: config.LIGHTENING_WEBSOCKET_PORT });

  let connections: WebSocket[] = [];
  let latest: WorldState | null = null;

  wss.on('connection', ws => {
    log.info('Client connected');

    connections.push(ws);
    log.debug(`Current connection count: ${connections.length}`);

    if (latest) emitWorldState(ws, latest);

    ws.on('message', message => {
      log.debug('Message from client', message);
    });

    ws.on('close', (code, reason) => {
      log.info('Client disconnected', { code, reason });
      connections = connections.filter(connection => connection !== ws);
      log.debug(`Current connection count: ${connections.length}`);
    });
  });

  return {
    emitWorldState(newWorldState: WorldState) {
      latest = newWorldState;
      connections.forEach(connection => emitWorldState(connection, newWorldState));
    },
  };

  function emitWorldState(ws: WebSocket, state: WorldState) {
    ws.send(JSON.stringify({ type: 'WORLD_STATE_UPDATE', state }, null, 2));
  }
}