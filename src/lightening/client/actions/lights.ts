import { WebSocketClient } from 'lightening/client/utils/ws';
import { assertExhausted } from 'lightening/shared/utils/types';
import { Light, Group } from 'lightening/shared/model/tradfri';

export function toggleLights(ws: WebSocketClient, object: Light | Group) {
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

export function setLights(ws: WebSocketClient, object: Light | Group, setOn = true) {
  switch (object.type) {
    case 'LIGHT':
      ws.send({
        setLight: object.id,
        setOn,
      });
      return null;
    case 'GROUP':
      ws.send({
        setGroup: object.id,
        setOn,
      });
      return null;
    default:
      return assertExhausted(object);
  }
}
