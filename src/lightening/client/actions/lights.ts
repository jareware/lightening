import { WebSocketClient } from 'lightening/client/utils/ws';
import { Light, Group } from 'lightening/utils/model';
import { assertExhausted } from 'lightening/utils/types';

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
