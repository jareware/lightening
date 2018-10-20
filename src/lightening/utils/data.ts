import { LighteningModel } from 'lightening/utils/model';

// Important: This isn't applicable to arbitrary objects, only LighteningModel.
// @see https://github.com/Microsoft/TypeScript/pull/12253#issuecomment-263132208
export function values<T extends LighteningModel>(object: { [key: string]: T }): T[] {
  return Object.keys(object).map(key => object[key]);
}
