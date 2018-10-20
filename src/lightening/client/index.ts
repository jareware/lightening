import { el, li, ul } from 'lightening/client/utils/el';
import { WorldState } from 'lightening/utils/model';
import { values } from 'lightening/utils/data';

var url = location.protocol.replace(/^http/, 'ws') + '//' + location.hostname + ':' + 8081;
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
  render(message.state);
};

function render(ws: WorldState) {
  console.log('render()', ws);
  document.body.innerHTML = '';
  el(
    document.body,
    ul(
      values(ws.objects).map(object =>
        li(
          { class: object.on ? 'on' : 'off', click: event => console.log('CLICK', event.target) },
          `[${object.type}] ${object.name}`,
        ),
      ),
    ),
  );
}
