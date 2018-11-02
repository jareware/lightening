import { el, pre } from 'lightening/client/utils/el';
import { createWsClient } from 'lightening/client/utils/ws';
import { createConsoleLogger } from 'lightening/shared/utils/logging';
import GroupTable from 'lightening/client/ui/GroupTable';
import { GlobalState } from 'lightening/shared/model/state';

const log = createConsoleLogger();
const wsUrl = location.protocol.replace(/^http/, 'ws') + '//' + location.hostname + ':' + 8081;
const ws = createWsClient(wsUrl, render, log);

function render(state: GlobalState) {
  const then = performance.now();
  document.body.innerHTML = '';
  el(
    document.body,
    !state.clientState.webSocketConnected && pre('Connecting...'),
    state.serverState && GroupTable(state.serverState, ws),
  );
  const now = performance.now();
  log.debug(`Rendering took ${(now - then).toFixed(1)} ms`);
}
