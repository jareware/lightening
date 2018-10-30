import WebSocket from 'ws';
import { NO_LOGGING } from 'lightening/shared/utils/logging';
import { Config } from 'lightening/shared/utils/config';
import { createTradfriClient } from 'lightening/shared/utils/tradfri';
import { ServerState } from 'lightening/shared/model/state';
import { encode, decode } from 'lightening/shared/model/utils';
import { WebSocketMessageFromClient, WebSocketMessageFromServer } from 'lightening/shared/model/message';
import { assertExhausted } from 'lightening/shared/utils/types';

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
      log.debug('Received raw message from client:', message);
      try {
        messageReceived(decode<WebSocketMessageFromClient>(message));
      } catch (err) {
        log.warn(`Received malformed message from client (${err.message})`);
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

  function messageReceived(message: WebSocketMessageFromClient): void {
    switch (message.type) {
      case 'ClientCommand':
        processCommand(message.command);
        log.info('Received command from client:', message);
        break;
      default:
        assertExhausted(message.type);
    }
  }

  function processCommand(command: WebSocketMessageFromClient['command']) {
    switch (command.type) {
      case 'SetLightState':
        command.targetIds.forEach(id =>
          tradfri.setLightState(id, typeof command.on === 'boolean' ? command.on : false),
        );
        break;
      default:
        assertExhausted(command.type);
    }
  }

  function emitWorldState(ws: WebSocket, state: ServerState) {
    ws.send(encode<WebSocketMessageFromServer>({ type: 'ServerStateUpdate', state }));
  }
}
