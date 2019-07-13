import * as Tradfri from 'node-tradfri-client'; // @see https://github.com/AlCalzone/node-tradfri-client
import { NO_LOGGING } from 'lightening/shared/utils/logging';
import { Config } from 'lightening/shared/utils/config';
import { EventEmitter } from 'events';
import {
  createGroup,
  createLight,
  createRemote,
  createPlug,
  TRADFRI_ACCESSORY_TYPE_REMOTE_SECONDARY,
  createSensor,
} from 'lightening/server/utils/model';
import { ServerState } from 'lightening/shared/model/state';
import { Device } from 'lightening/shared/model/tradfri';
import { LightStateCommand } from 'lightening/shared/model/message';

interface WorldStateEmitter extends EventEmitter {
  on(event: 'change', callback: (newWorldState: ServerState) => void): this;
}

export function createTradfriClient(config: Config, log = NO_LOGGING) {
  log.info('Creating Trådfri client', config);

  const tradfri = new Tradfri.TradfriClient(config.LIGHTENING_TRADFRI_HOSTNAME);
  const events: WorldStateEmitter = new EventEmitter();

  let state: ServerState = {
    devices: {},
  };

  const tradfriLookup: {
    [id: string]: Tradfri.Accessory | Tradfri.Group;
  } = {};

  log.debug('Connecting...');

  tradfri
    .connect(
      config.LIGHTENING_TRADFRI_IDENTITY,
      config.LIGHTENING_TRADFRI_PSK,
    )
    .then(() => {
      log.debug('Connected!');
      tradfri.on('group updated', group => update(convert(group))).observeGroupsAndScenes();
      tradfri.on('device updated', device => update(convert(device))).observeDevices();
      setInterval(() => {
        const then = Date.now();
        const timeout = 5000;
        tradfri.ping(timeout).then(success => {
          if (success) {
            log.debug(`Got ping from gateway (RTT ${Date.now() - then} ms)`);
          } else {
            log.warn(`Gateway did not respond to ping (timeout ${timeout} ms)`);
          }
        });
      }, 60 * 1000);
    })
    .catch(err => console.log('createTradfriClient() ERROR', err));

  return {
    events,
    setLightState,
  };

  function setLightState(id: number, setOn: LightStateCommand) {
    const light = tradfriLookup[id];
    if (light instanceof Tradfri.Accessory && light.type === Tradfri.AccessoryTypes.lightbulb) {
      light.lightList[0].toggle(typeof setOn === 'boolean' ? setOn : undefined);
    } else if (light instanceof Tradfri.Group) {
      if (typeof setOn === 'boolean') {
        light.toggle(setOn);
      } else {
        light.toggle(!light.onOff);
      }
    } else {
      throw new Error(`Didn't find Trådfri Light/Group with ID "${id}"`);
    }
  }

  function convert(x: Tradfri.Group | Tradfri.Accessory): Device | null {
    if (x instanceof Tradfri.Group) {
      tradfriLookup[x.instanceId] = x;
      return createGroup(x);
    } else if (x instanceof Tradfri.Accessory) {
      if (x.type === Tradfri.AccessoryTypes.lightbulb) {
        tradfriLookup[x.instanceId] = x;
        return createLight(x);
      } else if (x.type === Tradfri.AccessoryTypes.remote || x.type === TRADFRI_ACCESSORY_TYPE_REMOTE_SECONDARY) {
        tradfriLookup[x.instanceId] = x;
        return createRemote(x);
      } else if (x.type === Tradfri.AccessoryTypes.plug) {
        tradfriLookup[x.instanceId] = x;
        return createPlug(x);
      } else if (x.type === Tradfri.AccessoryTypes.motionSensor) {
        tradfriLookup[x.instanceId] = x;
        return createSensor(x);
      }
    }
    log.warn("Don't know what to do with Trådfri device:", { ...x, client: null }); // don't log the "client" property, because it's too noisy
    return null;
  }

  function update(device: Device | null) {
    if (!device) {
      log.debug('Ignoring empty world update');
      return;
    }
    log.debug(`${device.type}#${device.id} changed`);
    state = { ...state, devices: { ...state.devices, [device.id]: device } };
    events.emit('change', state);
  }
}
