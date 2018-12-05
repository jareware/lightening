import { table, tr, tbody, td, button } from 'lightening/client/utils/el';
import { values } from 'lightening/shared/utils/data';
import { WebSocketClient } from 'lightening/client/utils/ws';
import { setLights } from 'lightening/client/actions/lights';
import { ServerState } from 'lightening/shared/model/state';
import { is } from 'lightening/shared/model/utils';
import { Group } from 'lightening/shared/model/tradfri';
import { LightStateCommand } from 'lightening/shared/model/message';

export default (state: ServerState, ws: WebSocketClient) => {
  return table(
    { class: 'lightening-GroupTable' },
    tbody(
      values(state.devices)
        .filter(is('Group'))
        .map(group =>
          tr(
            {
              class: `lightening-GroupTable-${getOnOffState(group, state)}`,
              click: set(group, 'toggle'),
            },
            td(group.name),
            td(button({ class: `lightening-GroupTable-button`, click: set(group, true) }, 'On')),
            td(button({ class: `lightening-GroupTable-button`, click: set(group, false) }, 'Off')),
          ),
        ),
    ),
  );
  function set(group: Group, setOn: LightStateCommand) {
    return (event: Event) => {
      event.stopPropagation();
      setLights(ws, group, setOn);
    };
  }
};

export function getOnOffState(group: Group, state: ServerState) {
  const lightsOn = group.devices
    .map(id => state.devices[id])
    .filter(is('Light', 'Plug'))
    .map(device => device.on);
  const isTrue = (x: boolean) => x === true;
  const isFalse = (x: boolean) => x === false;
  if (lightsOn.some(isTrue)) {
    if (lightsOn.some(isFalse)) return 'mixed';
    return 'on';
  } else {
    return 'off';
  }
}
