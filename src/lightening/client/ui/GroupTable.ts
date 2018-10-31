import { table, thead, tr, th, tbody, td, button } from 'lightening/client/utils/el';
import { values } from 'lightening/shared/utils/data';
import { WebSocketClient } from 'lightening/client/utils/ws';
import { setLights } from 'lightening/client/actions/lights';
import { ServerState } from 'lightening/shared/model/state';
import { is } from 'lightening/shared/model/utils';
import { Group } from 'lightening/shared/model/tradfri';

export default (state: ServerState, ws: WebSocketClient) =>
  table(
    { class: 'lightening-GroupTable' },
    thead(
      tr(
        // Must match order of <td>'s below
        th('ID'),
        th('Name'),
        th('Devices'),
        th('On'),
      ),
    ),
    tbody(
      values(state.objects)
        .filter(is.Group)
        .map(group =>
          tr(
            { class: group.on ? 'lightening-GroupTable-on' : '' },
            td(group.id),
            td(group.name),
            td(group.devices.length),
            td(getOnOffState(group, state)),
            td(button('On', { click: () => setLights(ws, group, true) })),
            td(button('Off', { click: () => setLights(ws, group, false) })),
          ),
        ),
    ),
  );

function getOnOffState(group: Group, state: ServerState) {
  const lightsOn = group.devices
    .map(id => state.objects[id])
    .filter(is.Light)
    .map(light => light.on);
  const isTrue = (x: boolean) => x === true;
  const isFalse = (x: boolean) => x === false;
  if (lightsOn.some(isTrue)) {
    if (lightsOn.some(isFalse)) return 'mixed';
    return 'on';
  } else {
    return 'off';
  }
}
