import { WebSocketClient } from 'lightening/client/utils/ws';
import { assertExhausted } from 'lightening/shared/utils/types';
import { Light, Group } from 'lightening/shared/model/tradfri';

export function setLights(ws: WebSocketClient, device: Light | Group, setOn = true): void {
  switch (device.type) {
    case 'Light':
    case 'Group':
      ws.send({
        type: 'ClientCommand',
        command: {
          type: 'SetLightState',
          targetIds: [device.id],
          on: setOn,
        },
      });
      break;
    default:
      assertExhausted(device);
  }
}
