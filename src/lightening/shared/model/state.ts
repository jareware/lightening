import { Device } from 'lightening/shared/model/tradfri';

export type GlobalState = {
  clientState: ClientState;
  serverState: ServerState | null;
};

export type ClientState = {
  webSocketConnected: boolean;
};

export type ServerState = {
  objects: { [id: string]: Device };
};
