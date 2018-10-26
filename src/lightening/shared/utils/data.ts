import { Device } from 'lightening/shared/model/tradfri';

// Important: This isn't applicable to arbitrary objects, only known model types.
// @see https://github.com/Microsoft/TypeScript/pull/12253#issuecomment-263132208
export function values<T extends Device>(object: { [key: string]: T }): T[] {
  return Object.keys(object).map(key => object[key]);
}
