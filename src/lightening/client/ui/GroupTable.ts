import { WorldState, is } from 'lightening/utils/model';
import { table, thead, tr, th, tbody, td, button } from 'lightening/client/utils/el';
import { values } from 'lightening/utils/data';
import { WebSocketClient } from 'lightening/client/utils/ws';
import { setLights } from 'lightening/client/actions/lights';

export default (state: WorldState, ws: WebSocketClient) =>
  table(
    { class: 'lightening-GroupTable' },
    thead(
      tr(
        // Must match order of <td>'s below
        th('ID'),
        th('Name'),
        th('Devices'),
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
            td(button('On', { click: () => setLights(ws, group, true) })),
            td(button('Off', { click: () => setLights(ws, group, false) })),
          ),
        ),
    ),
  );