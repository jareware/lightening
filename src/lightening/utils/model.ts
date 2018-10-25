export type LighteningModel = WorldState | Light | Group;
export type TradfriObject = Light | Group;

export type WorldState = { objects: { [id: string]: TradfriObject } };

export type WhiteColor = {
  space: 'white';
  temperature: number;
};

export type RgbColor = {
  space: 'rgb';
  hue: number;
  saturation: number;
};

export type Color = WhiteColor | RgbColor;

export type Light = {
  type: 'LIGHT';
  id: number;
  name: string;
  model: string;
  power: number;
  alive: boolean;
  on: boolean;
  dimmer: number;
  color: Color;
};

export type Group = {
  type: 'GROUP';
  id: number;
  name: string;
  on: boolean;
  dimmer: number;
  devices: number[];
};

export const is = {
  Light: (x: any): x is Light => typeof x === 'object' && x.type === 'LIGHT',
  Group: (x: any): x is Group => typeof x === 'object' && x.type === 'GROUP',
};
