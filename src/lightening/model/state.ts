import { Device } from 'lightening/model/tradfri';

export type ClientState = {};

export type ServerState = {
  objects: { [id: string]: Device };
};

export type ClientCommand = {
  type: 'SetLightState';
  targetIds: string[];
  on: true | false | 'toggle';
};
