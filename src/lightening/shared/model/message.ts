import { ServerState } from 'lightening/shared/model/state';

export type WebSocketMessageFromServer =
  | {
      type: 'ServerStateUpdate';
      state: ServerState;
    }
  | {
      type: 'FloorPlanUpdate';
      svgSrc: string;
    };

export type LightStateCommand = true | false | 'toggle';

export type WebSocketMessageFromClient = {
  type: 'ClientCommand';
  command: {
    type: 'SetLightState';
    targetIds: number[];
    on: LightStateCommand;
  };
};

export type WebSocketMessage = WebSocketMessageFromClient | WebSocketMessageFromServer;
