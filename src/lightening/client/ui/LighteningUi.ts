import { div, pre, button } from 'lightening/client/utils/el';
import { GlobalState } from 'lightening/shared/model/state';
import { WebSocketClient } from 'lightening/client/utils/ws';
import FloorPlan from 'lightening/client/ui/FloorPlan';

export default (state: GlobalState, ws: WebSocketClient) => {
  const fullscreenButtonVisible = location.search.indexOf('fullscreen') !== -1;
  const fullscreenButton = button('Enter full screen', {
    click() {
      launchIntoFullscreen(document.querySelector('.lightening-LighteningUi'));
      fullscreenButton.style.display = 'none'; // doing this via the :fullscreen CSS selector won't sit well with older browsers :/
    },
  });
  return div(
    { class: 'lightening-LighteningUi' },
    !state.clientState.webSocketConnected && pre('Connecting...'),
    fullscreenButtonVisible && fullscreenButton,
    FloorPlan(state, ws),
  );
};

function launchIntoFullscreen(el: any) {
  if (el.requestFullscreen) el.requestFullscreen();
  if (el.mozRequestFullScreen) el.mozRequestFullScreen();
  if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
  if (el.msRequestFullscreen) el.msRequestFullscreen();
}
