import { div, pre } from 'lightening/client/utils/el';
import { GlobalState } from 'lightening/shared/model/state';
import { WebSocketClient } from 'lightening/client/utils/ws';
import { setLights } from 'lightening/client/actions/lights';
import { is } from 'lightening/shared/model/utils';

export default (state: GlobalState, ws: WebSocketClient) => {
  return div(
    { class: 'lightening-LighteningUi' },
    !state.clientState.webSocketConnected && pre('Connecting...'),
    renderFloorPlan(),
  );

  function renderFloorPlan() {
    if (!state.clientState.floorPlanSvg) return pre('Loading floor plan...');
    const fp = div({
      click: (event: any) => {
        if (!state.serverState) return;
        const target: HTMLElement | SVGElement | null = event.target;
        if (!target) return;
        const id = target.getAttribute('lightening-id');
        if (!id) return;
        const group = state.serverState.devices[id];
        if (!is('Group')(group)) return;
        setLights(ws, group, 'toggle');
      },
    });
    fp.innerHTML = state.clientState.floorPlanSvg;
    return fp;
  }
};
