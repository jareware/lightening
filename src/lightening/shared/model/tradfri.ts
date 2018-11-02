export type Device = Light | Remote | Outlet | Sensor | Group;

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
  type: 'Light';
  id: number;
  name: string;
  model: string;
  power: number;
  alive: boolean;
  on: boolean;
  dimmer: number;
  color: Color;
};

export type Remote = {
  type: 'Remote';
  id: number;
  name: string;
  power: number;
  alive: boolean;
  battery: number;
};

export type Outlet = {
  type: 'Outlet';
  id: number;
  name: string;
  power: number;
  alive: boolean;
  on: boolean;
};

export type Sensor = {
  type: 'Sensor';
  id: number;
  name: string;
  power: number;
  alive: boolean;
  battery: number;
};

export type Group = {
  type: 'Group';
  id: number;
  name: string;
  on: boolean;
  dimmer: number;
  devices: number[];
};
