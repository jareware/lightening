import { div, pre, object } from 'lightening/client/utils/el';
import { GlobalState } from 'lightening/shared/model/state';
import { WebSocketClient } from 'lightening/client/utils/ws';

export default (state: GlobalState, _ws: WebSocketClient) => {
  const floorplan = object({
    type: 'image/svg+xml',
    data: 'floorplan.svg',
    load: () => {
      console.log('SVG loaded', floorplan);
    },
  });
  return div(
    { class: 'lightening-LighteningUi' },
    !state.clientState.webSocketConnected && pre('Connecting...'),
    floorplan,
  );
};
