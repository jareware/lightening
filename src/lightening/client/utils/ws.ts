import { NO_LOGGING } from 'lightening/shared/utils/logging';
import { GlobalState, ServerState, ClientState } from 'lightening/shared/model/state';
import { decodeWebSocketMessage } from 'lightening/shared/model/utils';

export type WebSocketClient = ReturnType<typeof createWsClient>;

export function createWsClient(url: string, callback: (state: GlobalState) => void, log = NO_LOGGING) {
  let socket: WebSocket | null = null;
  let latestServerState: ServerState | null = null;
  let latestClientState: ClientState = { webSocketConnected: false };

  connect();

  return {
    send(message: object) {
      if (socket) {
        socket.send(JSON.stringify(message, null, 2));
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
    const message = decodeWebSocketMessage(evt.data);
    log.debug('WebSocket message', message);
    latestClientState = { ...latestClientState, webSocketConnected: true };
    if (message.type === 'ServerStateUpdate') {
      latestServerState = message.state;
    } else {
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
