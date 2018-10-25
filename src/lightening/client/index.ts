import { el } from 'lightening/client/utils/el';
import { WorldState } from 'lightening/utils/model';
import { createWsClient } from 'lightening/client/utils/ws';
import { createConsoleLogger } from 'lightening/utils/logging';
import GroupTable from 'lightening/client/ui/GroupTable';

const log = createConsoleLogger();
const wsUrl = location.protocol.replace(/^http/, 'ws') + '//' + location.hostname + ':' + 8081;
const ws = createWsClient(wsUrl, render, log);

function render(state: WorldState) {
  document.body.innerHTML = '';
  el(document.body, GroupTable(state, ws));
}
