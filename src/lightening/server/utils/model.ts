import * as Tradfri from 'node-tradfri-client'; // @see https://github.com/AlCalzone/node-tradfri-client
import { Light, Group, Remote, Outlet } from 'lightening/shared/model/tradfri';

export const TRADFRI_ACCESSORY_TYPE_OUTLET = 3; // for whatever reason, this isn't part of the Tradfri.AccessoryTypes enum
export const TRADFRI_ACCESSORY_TYPE_REMOTE_SECONDARY = 1; // again, for reasons unknown, remotes which are paired with another remote have a separate type, not included in Tradfri.AccessoryTypes

export function createLight(light: Tradfri.Accessory): Light {
  if (light.type !== Tradfri.AccessoryTypes.lightbulb)
    throw new Error(`Unexpected type "${light.type}", expecting "${Tradfri.AccessoryTypes.lightbulb}" for a Light`);
  if (light.lightList.length !== 1)
    throw new Error(`Unexpected lightList length "${light.lightList.length}" for instanceId "${light.instanceId}"`);
  return {
    type: 'Light',
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

export function createRemote(remote: Tradfri.Accessory): Remote {
  if (remote.type !== Tradfri.AccessoryTypes.remote && remote.type !== TRADFRI_ACCESSORY_TYPE_REMOTE_SECONDARY)
    throw new Error(
      `Unexpected type "${remote.type}", expecting "${
        Tradfri.AccessoryTypes.remote
      }" or "${TRADFRI_ACCESSORY_TYPE_REMOTE_SECONDARY}" for a Remote`,
    );
  return {
    type: 'Remote',
    id: remote.instanceId,
    name: remote.name,
    power: remote.deviceInfo.power,
    alive: remote.alive,
    battery: remote.deviceInfo.battery,
  };
}

export function createOutlet(outlet: Tradfri.Accessory): Outlet {
  if (outlet.type !== TRADFRI_ACCESSORY_TYPE_OUTLET)
    throw new Error(`Unexpected type "${outlet.type}", expecting "${TRADFRI_ACCESSORY_TYPE_OUTLET}" for an Outlet`);
  return {
    type: 'Outlet',
    id: outlet.instanceId,
    name: outlet.name,
    power: outlet.deviceInfo.power,
    alive: outlet.alive,
  };
}

export function createGroup(group: Tradfri.Group): Group {
  return {
    type: 'Group',
    id: group.instanceId,
    name: group.name,
    on: group.onOff,
    dimmer: group.dimmer,
    devices: group.deviceIDs,
  };
}
