import { el } from 'lightening/client/utils/el';
import { createWsClient } from 'lightening/client/utils/ws';
import { createConsoleLogger } from 'lightening/shared/utils/logging';
import GroupTable from 'lightening/client/ui/GroupTable';
import { ServerState } from 'lightening/shared/model/state';

const log = createConsoleLogger();
const wsUrl = location.protocol.replace(/^http/, 'ws') + '//' + location.hostname + ':' + 8081;
const ws = createWsClient(wsUrl, render, log);

function render(state: ServerState) {
  document.body.innerHTML = '';
  el(document.body, GroupTable(state, ws));
}
