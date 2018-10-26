import { table, thead, tr, th, tbody, td, button } from 'lightening/client/utils/el';
import { values } from 'lightening/utils/data';
import { WebSocketClient } from 'lightening/client/utils/ws';
import { setLights } from 'lightening/client/actions/lights';
import { ServerState } from 'lightening/model/state';
import { is } from 'lightening/model/utils';

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
            td(group.on ? 'On' : ''),
            td(button('On', { click: () => setLights(ws, group, true) })),
            td(button('Off', { click: () => setLights(ws, group, false) })),
          ),
        ),
    ),
  );
