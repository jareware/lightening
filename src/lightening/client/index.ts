import { el } from 'lightening/client/utils/el';
import { createWsClient } from 'lightening/client/utils/ws';
import { createConsoleLogger } from 'lightening/shared/utils/logging';
import { GlobalState } from 'lightening/shared/model/state';
import LighteningUi from 'lightening/client/ui/LighteningUi';

const log = createConsoleLogger();
const wsUrl = location.protocol.replace(/^http/, 'ws') + '//' + location.hostname + ':' + 8081;
const ws = createWsClient(wsUrl, render, log);

function render(state: GlobalState) {
  const then = performance.now();
  document.body.innerHTML = '';
  el(document.body, LighteningUi(state, ws));
  const now = performance.now();
  log.debug(`Rendering took ${(now - then).toFixed(1)} ms`);
}

if (location.search.indexOf('fullscreen') !== -1) {
  const fs = () => {
    launchIntoFullscreen(document.body);
    document.body.removeEventListener('click', fs);
  };
  document.body.addEventListener('click', fs);
}

function launchIntoFullscreen(el: any) {
  if (el.requestFullscreen) el.requestFullscreen();
  if (el.mozRequestFullScreen) el.mozRequestFullScreen();
  if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
  if (el.msRequestFullscreen) el.msRequestFullscreen();
}
