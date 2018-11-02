import { Device, DeviceOfType } from 'lightening/shared/model/tradfri';
import { WebSocketMessage } from 'lightening/shared/model/message';

export function encode<T extends WebSocketMessage>(message: T): string {
  return JSON.stringify(message, null, 2);
}

export function decode<T extends WebSocketMessage>(message: string | Buffer | ArrayBuffer | Buffer[]): T {
  if (typeof message !== 'string') {
    throw new Error(`Unexpected runtime type for WebSocketMessage while decoding: ${typeof message}`);
  }
  const any = JSON.parse(message + '');
  if (any && typeof any === 'object' && any['type']) {
    return any;
  } else {
    throw new Error(`Tried to decode malformed WebSocketMessage: ${message}`);
  }
}

// @example array.filter(is('Light'))
// prettier-ignore
export function is<T extends Device, T1 extends T['type'] & Device['type']>(mt1: T1): (model: Device, _index?: number, array?: T[]) => model is DeviceOfType<T1>;
// prettier-ignore
export function is<T extends Device, T1 extends T['type'] & Device['type'], T2 extends T['type'] & Device['type']>(mt1: T1, mt2: T2): (model: Device, _index?: number, array?: T[]) => model is DeviceOfType<T1> | DeviceOfType<T2>;
// prettier-ignore
export function is<T extends Device, T1 extends T['type'] & Device['type'], T2 extends T['type'] & Device['type'], T3 extends T['type'] & Device['type']>(mt1: T1, mt2: T2, mt3: T3): (model: Device, _index?: number, array?: T[]) => model is DeviceOfType<T1> | DeviceOfType<T2> | DeviceOfType<T3>;
export function is(...modelTypes: string[]) {
  return (model: Device, _index: number, _array: any[]) => modelTypes.indexOf(model.type) !== -1;
}
