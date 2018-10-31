import { table, tr, tbody, td, button } from 'lightening/client/utils/el';
import { values } from 'lightening/shared/utils/data';
import { WebSocketClient } from 'lightening/client/utils/ws';
import { setLights } from 'lightening/client/actions/lights';
import { ServerState } from 'lightening/shared/model/state';
import { is } from 'lightening/shared/model/utils';
import { Group } from 'lightening/shared/model/tradfri';

export default (state: ServerState, ws: WebSocketClient) =>
  table(
    { class: 'lightening-GroupTable' },
    tbody(
      values(state.objects)
        .filter(is.Group)
        .map(group =>
          tr(
            { class: `lightening-GroupTable-${getOnOffState(group, state)}` },
            td(group.name),
            td(button({ class: `lightening-GroupTable-button` }, 'On', { click: () => setLights(ws, group, true) })),
            td(button({ class: `lightening-GroupTable-button` }, 'Off', { click: () => setLights(ws, group, false) })),
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
