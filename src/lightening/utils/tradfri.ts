import { TradfriClient, Accessory, Group, AccessoryTypes } from 'node-tradfri-client';
import { NO_LOGGING } from 'lightening/utils/logging';
import { Config } from 'lightening/utils/config';

export function createTradfriClient(config: Config, log = NO_LOGGING) {
  log.info('Creating Trådfri client', config);

  const tradfri = new TradfriClient(config.LIGHTENING_TRADFRI_HOSTNAME);
  const devices: { [id: string]: Accessory } = {};
  const groups: { [id: string]: Group } = {};

  log.debug('Connecting...');
  tradfri
    .connect(
      config.LIGHTENING_TRADFRI_IDENTITY,
      config.LIGHTENING_TRADFRI_PSK,
    )
    .then(() => {
      log.debug('Connected!');
      tradfri
        .on('group updated', group => {
          log.debug(`Group "${group.instanceId}" updated`);
          groups[group.instanceId] = group;
        })
        .observeGroupsAndScenes();
      tradfri
        .on('device updated', device => {
          log.debug(`Device "${device.instanceId}" updated`);
          devices[device.instanceId] = device;
        })
        .observeDevices();
    })
    .catch(err => console.log('ERROR', err));
}

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
  type: 'LIGHT';
  id: number;
  name: string;
  model: string;
  power: number;
  alive: boolean;
  on: boolean;
  dimmer: number;
  color: Color;
};

export function createLight(light: Accessory): Light {
  if (light.type !== AccessoryTypes.lightbulb)
    throw new Error(`Unexpected type "${light.type}", expecting "${AccessoryTypes.lightbulb}" for a Light`);
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
