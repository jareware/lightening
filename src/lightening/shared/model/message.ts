import { ServerState } from 'lightening/shared/model/state';

export type WebSocketMessageFromServer = {
  type: 'ServerStateUpdate';
  state: ServerState;
};

export type WebSocketMessageFromClient = {
  type: 'ClientCommand';
  command: {
    type: 'SetLightState';
    targetIds: number[];
    on: true | false | 'toggle';
  };
};

export type WebSocketMessage = WebSocketMessageFromClient | WebSocketMessageFromServer;
