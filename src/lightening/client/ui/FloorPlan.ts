import { div } from 'lightening/client/utils/el';
import { GlobalState } from 'lightening/shared/model/state';
import { WebSocketClient } from 'lightening/client/utils/ws';
import { setLights } from 'lightening/client/actions/lights';
import { is } from 'lightening/shared/model/utils';
import { getOnOffState } from 'lightening/client/ui/GroupTable';

export default (state: GlobalState, ws: WebSocketClient) => {
  const fp = div({
    class: 'lightening-FloorPlan',
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
  if (!state.clientState.floorPlanSvg) {
    return fp; // floor plan not loaded yet -> return empty div
  }
  fp.innerHTML = state.clientState.floorPlanSvg; // parse SVG string into the DOM
  Array.prototype.slice.call(fp.querySelectorAll('[lightening-id]')).forEach((el: SVGElement) => {
    if (!state.serverState) return;
    const id = el.getAttribute('lightening-id');
    if (!id) return;
    const group = state.serverState.devices[id];
    if (!is('Group')(group)) return;
    const on = getOnOffState(group, state.serverState);
    if (on === 'on') {
      el.setAttribute('lightening-on', 'true');
    } else {
      el.removeAttribute('lightening-on');
    }
  });
  return fp;
};
