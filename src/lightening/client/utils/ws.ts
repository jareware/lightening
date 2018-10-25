import { WorldState } from 'lightening/utils/model';
import { NO_LOGGING } from 'lightening/utils/logging';

export function createWsClient(url: string, callback: (ws: WorldState) => void, log = NO_LOGGING) {
  let socket: WebSocket | null = null;

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
    socket.addEventListener('open', onOpen);
    socket.addEventListener('close', onClose);
    socket.addEventListener('error', onError);
    socket.addEventListener('message', onMessage);
  }

  function onOpen() {
    log.info('WebSocket opened');
  }

  function onClose() {
    log.info('WebSocket closed');
    setTimeout(connect, 3000);
  }

  function onError(err: Event) {
    log.warn('WebSocket error', err);
  }

  function onMessage(evt: MessageEvent) {
    const message = JSON.parse(evt.data);
    log.debug('WebSocket message', message);
    if (message.type === 'WORLD_STATE_UPDATE') {
      callback(message.state);
    } else {
      log.warn('Received unsupported message type', message);
    }
  }
}
