import { Light, Group } from 'lightening/shared/model/tradfri';
import { WebSocketMessage } from 'lightening/shared/model/message';

export const is = {
  Light: (x: any): x is Light => typeof x === 'object' && x.type === 'LIGHT',
  Group: (x: any): x is Group => typeof x === 'object' && x.type === 'GROUP',
};

export function encodeWebSocketMessage(message: WebSocketMessage): string {
  return JSON.stringify(message, null, 2);
}

export function decodeWebSocketMessage(message: string): WebSocketMessage {
  const any = JSON.parse(message);
  if (any && typeof any === 'object' && any['type']) {
    return any;
  } else {
    throw new Error(`Tried to decode malformed WebSocketMessage: ${message}`);
  }
}
