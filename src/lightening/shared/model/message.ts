import { ServerState } from 'lightening/shared/model/state';

export type WebSocketMessage =
  | {
      type: 'ServerStateUpdate';
      state: ServerState;
    }
  | {
      type: 'ClientCommand';
      command: {
        type: 'SetLightState';
        targetIds: string[];
        on: true | false | 'toggle';
      };
    };
