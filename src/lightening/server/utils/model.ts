import * as Tradfri from 'node-tradfri-client'; // @see https://github.com/AlCalzone/node-tradfri-client
import { Light, Group } from 'lightening/utils/model';

export function createLight(light: Tradfri.Accessory): Light {
  if (light.type !== Tradfri.AccessoryTypes.lightbulb)
    throw new Error(`Unexpected type "${light.type}", expecting "${Tradfri.AccessoryTypes.lightbulb}" for a Light`);
  if (light.lightList.length !== 1)
    throw new Error(`Unexpected lightList length "${light.lightList.length}" for instanceId "${light.instanceId}"`);
  return {
    type: 'LIGHT',
    id: light.instanceId,
    name: light.name,
    model: light.deviceInfo.modelNumber,
    power: light.deviceInfo.power,
    alive: light.alive,
    on: light.lightList[0].onOff,
    dimmer: light.lightList[0].dimmer,
    color:
      'hue' in light.lightList[0]
        ? { space: 'rgb', hue: light.lightList[0].hue, saturation: light.lightList[0].saturation }
        : { space: 'white', temperature: light.lightList[0].colorTemperature },
  };
}

export function createGroup(group: Tradfri.Group): Group {
  return {
    type: 'GROUP',
    id: group.instanceId,
    name: group.name,
    on: group.onOff,
    dimmer: group.dimmer,
    devices: group.deviceIDs,
  };
}
