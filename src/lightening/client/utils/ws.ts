import { NO_LOGGING } from 'lightening/shared/utils/logging';
import { GlobalState, ServerState, ClientState } from 'lightening/shared/model/state';
import { decode, encode } from 'lightening/shared/model/utils';
import { WebSocketMessageFromServer, WebSocketMessageFromClient } from 'lightening/shared/model/message';
import { assertExhausted } from 'lightening/shared/utils/types';

export type WebSocketClient = ReturnType<typeof createWsClient>;

export function createWsClient(url: string, callback: (state: GlobalState) => void, log = NO_LOGGING) {
  let socket: WebSocket | null = null;
  let latestServerState: ServerState | null = null;
  let latestClientState: ClientState = { floorPlanSvg: '', webSocketConnected: false };

  connect();

  return {
    send(message: WebSocketMessageFromClient) {
      if (socket) {
        socket.send(encode<WebSocketMessageFromClient>(message));
      } else {
        log.warn("WebSocket isn't connected, can't send message", message);
      }
    },
  };

  function connect() {
    log.info('WebSocket connecting...');
    socket = new WebSocket(url);
    socket.addEventListener('open', withEmit(onOpen));
    socket.addEventListener('close', withEmit(onClose));
    socket.addEventListener('error', withEmit(onError));
    socket.addEventListener('message', withEmit(onMessage));
  }

  function onOpen() {
    latestClientState = { ...latestClientState, webSocketConnected: true };
    log.info('WebSocket opened');
  }

  function onClose() {
    log.info('WebSocket closed');
    latestClientState = { ...latestClientState, webSocketConnected: false };
    setTimeout(connect, 3000);
  }

  function onError(_evt: Event) {
    latestClientState = { ...latestClientState, webSocketConnected: false };
    log.warn('WebSocket error');
  }

  function onMessage(evt: MessageEvent) {
    const message = decode<WebSocketMessageFromServer>(evt.data);
    log.debug('WebSocket message', message);
    latestClientState = { ...latestClientState, webSocketConnected: true };
    switch (message.type) {
      case 'ServerStateUpdate':
        latestServerState = message.state;
        break;
      case 'FloorPlanUpdate':
        latestClientState = { ...latestClientState, floorPlanSvg: message.svgSrc };
        break;
      default:
        assertExhausted(message);
        log.warn('Received unsupported message type', message);
    }
  }

  function withEmit(f: (...args: any[]) => void) {
    return (...args: any[]) => {
      f.apply(null, args);
      if (latestServerState) {
        const state = { clientState: latestClientState, serverState: latestServerState };
        log.info('Emitting new global state', state);
        callback(state);
      }
    };
  }
}
