import { Light, Group } from 'lightening/shared/model/tradfri';

export const is = {
  Light: (x: any): x is Light => typeof x === 'object' && x.type === 'LIGHT',
  Group: (x: any): x is Group => typeof x === 'object' && x.type === 'GROUP',
};
