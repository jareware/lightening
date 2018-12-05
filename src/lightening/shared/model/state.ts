import { Device } from 'lightening/shared/model/tradfri';

export type GlobalState = {
  clientState: ClientState;
  serverState: ServerState | null;
};

export type ClientState = {
  webSocketConnected: boolean;
  floorPlanSvg: null | string;
};

export type ServerState = {
  devices: { [id: string]: Device };
};
