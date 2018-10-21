import { el, li, ul } from 'lightening/client/utils/el';
import { WorldState, Light, Group } from 'lightening/utils/model';
import { values } from 'lightening/utils/data';
import { createWsClient } from 'lightening/client/utils/ws';
import { createConsoleLogger } from 'lightening/utils/logging';
import { assertExhausted } from 'lightening/utils/types';

const log = createConsoleLogger();
const url = location.protocol.replace(/^http/, 'ws') + '//' + location.hostname + ':' + 8081;

const ws = createWsClient(url, render, log);

function render(ws: WorldState) {
  document.body.innerHTML = '';
  el(
    document.body,
    ul(
      values(ws.objects).map(object =>
        li(
          { class: object.on ? 'on' : 'off', click: () => toggle(object) },
          `[${object.type}#${object.id}] ${object.name} (dimmer: ${object.dimmer})`,
        ),
      ),
    ),
  );
}

function toggle(object: Light | Group) {
  switch (object.type) {
    case 'LIGHT':
      ws.send({
        toggleLight: object.id,
      });
      return null;
    case 'GROUP':
      ws.send({
        toggleGroup: object.id,
      });
      return null;
    default:
      return assertExhausted(object);
  }
}
