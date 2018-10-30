import { Light, Group } from 'lightening/shared/model/tradfri';
import { WebSocketMessage } from 'lightening/shared/model/message';

export const is = {
  Light: (x: any): x is Light => typeof x === 'object' && x.type === 'LIGHT',
  Group: (x: any): x is Group => typeof x === 'object' && x.type === 'GROUP',
};

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
