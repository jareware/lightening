import { WebSocketClient } from 'lightening/client/utils/ws';
import { assertExhausted } from 'lightening/shared/utils/types';
import { Light, Group } from 'lightening/shared/model/tradfri';

export function setLights(ws: WebSocketClient, object: Light | Group, setOn = true): void {
  switch (object.type) {
    case 'LIGHT':
    case 'GROUP':
      ws.send({
        type: 'ClientCommand',
        command: {
          type: 'SetLightState',
          targetIds: [object.id],
          on: setOn,
        },
      });
      break;
    default:
      assertExhausted(object);
  }
}
