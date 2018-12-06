import { div, pre } from 'lightening/client/utils/el';
import { GlobalState } from 'lightening/shared/model/state';
import { WebSocketClient } from 'lightening/client/utils/ws';
import FloorPlan from 'lightening/client/ui/FloorPlan';

export default (state: GlobalState, ws: WebSocketClient) => {
  return div(
    { class: 'lightening-LighteningUi' },
    !state.clientState.webSocketConnected && pre('Connecting...'),
    FloorPlan(state, ws),
  );
};
