export type Device = Light | Remote | Plug | Sensor | Group;
export type DeviceOfType<T extends Device['type']> = Extract<Device, { type: T }>;

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

export type Plug = {
  type: 'Plug';
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
