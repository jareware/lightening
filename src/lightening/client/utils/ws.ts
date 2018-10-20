import { WorldState } from 'lightening/utils/model';

export function createWsClient(url: string, callback: (ws: WorldState) => void) {
  var socket = new WebSocket(url);

  socket.onopen = function(evt) {
    console.log('WebSocket opened', evt);
  };
  socket.onclose = function(evt) {
    console.log('WebSocket closed', evt);
  };
  socket.onerror = function(evt) {
    console.log('WebSocket error', evt);
  };
  socket.onmessage = function(evt) {
    const message = JSON.parse(evt.data);
    console.log('WebSocket message', message);
    if (message.type === 'WORLD_STATE_UPDATE') {
      callback(message.state);
    } else {
      console.warn('Received unsupported message', message);
    }
  };
}
