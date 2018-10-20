import { el, li, ul } from 'lightening/client/utils/el';
import { WorldState } from 'lightening/utils/model';
import { values } from 'lightening/utils/data';
import { createWsClient } from 'lightening/client/utils/ws';

var url = location.protocol.replace(/^http/, 'ws') + '//' + location.hostname + ':' + 8081;

createWsClient(url, render);

function render(ws: WorldState) {
  console.log('render()', ws);
  document.body.innerHTML = '';
  el(
    document.body,
    ul(
      values(ws.objects).map(object =>
        li(
          { class: object.on ? 'on' : 'off', click: event => console.log('CLICK', event.target) },
          `[${object.type}#${object.id}] ${object.name} (dimmer: ${object.dimmer})`,
        ),
      ),
    ),
  );
}
