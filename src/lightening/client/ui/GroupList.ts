import { WorldState, Light, Group } from 'lightening/utils/model';
import { div } from 'lightening/client/utils/el';
import { values } from 'lightening/utils/data';
import { WebSocketClient } from 'lightening/client/utils/ws';
import { assertExhausted } from 'lightening/utils/types';

export default (state: WorldState, ws: WebSocketClient) =>
  div(
    { class: 'lightening-GroupList' },
    values(state.objects).map(object =>
      div(
        { class: object.on ? 'on' : 'off', click: () => toggle(ws, object) },
        `[${object.type}#${object.id}] ${object.name} (dimmer: ${object.dimmer})`,
      ),
    ),
  );

function toggle(ws: WebSocketClient, object: Light | Group) {
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
