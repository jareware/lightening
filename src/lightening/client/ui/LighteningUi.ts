import { div, pre, object } from 'lightening/client/utils/el';
import { GlobalState } from 'lightening/shared/model/state';
import { WebSocketClient } from 'lightening/client/utils/ws';

export default (state: GlobalState, _ws: WebSocketClient) => {
  return div(
    { class: 'lightening-LighteningUi' },
    !state.clientState.webSocketConnected && pre('Connecting...'),
    object({ type: 'image/svg+xml', data: 'floorplan.svg' }),
  );
};
