import { WorldState } from 'lightening/utils/model';
import { NO_LOGGING } from 'lightening/utils/logging';

export function createWsClient(url: string, callback: (ws: WorldState) => void, log = NO_LOGGING) {
  const socket = new WebSocket(url);
  socket.addEventListener('open', () => log.info('WebSocket opened'));
  socket.addEventListener('close', () => log.info('WebSocket closed'));
  socket.addEventListener('error', err => log.warn('WebSocket error', err));
  socket.addEventListener('message', evt => {
    const message = JSON.parse(evt.data);
    log.debug('WebSocket message', message);
    if (message.type === 'WORLD_STATE_UPDATE') {
      callback(message.state);
    } else {
      log.warn('Received unsupported message type', message);
    }
  });
}
