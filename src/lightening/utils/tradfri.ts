import * as Tradfri from 'node-tradfri-client'; // @see https://github.com/AlCalzone/node-tradfri-client
import { NO_LOGGING } from 'lightening/utils/logging';
import { Config } from 'lightening/utils/config';
import { EventEmitter } from 'events';
import { createGroup, createLight } from 'lightening/server/utils/model';
import { ServerState } from 'lightening/model/state';
import { Device } from 'lightening/model/tradfri';

interface WorldStateEmitter extends EventEmitter {
  on(event: 'change', callback: (newWorldState: ServerState) => void): this;
}

export function createTradfriClient(config: Config, log = NO_LOGGING) {
  log.info('Creating Trådfri client', config);

  const tradfri = new Tradfri.TradfriClient(config.LIGHTENING_TRADFRI_HOSTNAME);
  const events: WorldStateEmitter = new EventEmitter();

  let state: ServerState = {
    objects: {},
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
        tradfri
          .ping(timeout)
          .then(
            () => log.debug(`Got ping from gateway (RTT ${Date.now() - then} ms)`),
            () => log.warn(`Gateway did not respond to ping (timeout ${timeout} ms)`),
          );
      }, 60 * 1000);
    })
    .catch(err => console.log('ERROR', err));

  return {
    events,
    toggleLight(id: number) {
      return Promise.resolve()
        .then(() => tradfriLookup[id])
        .then(x => {
          if (x instanceof Tradfri.Accessory && x.type === Tradfri.AccessoryTypes.lightbulb) {
            return x.lightList[0].toggle();
          } else {
            throw new Error(`Didn't find light "${id}"`);
          }
        });
    },
    toggleGroup(id: number) {
      return Promise.resolve()
        .then(() => tradfriLookup[id])
        .then(x => {
          if (x instanceof Tradfri.Group) {
            return x.toggle(!x.onOff);
          } else {
            throw new Error(`Didn't find group "${id}"`);
          }
        });
    },
    setGroup(id: number, setOn: boolean) {
      return Promise.resolve()
        .then(() => tradfriLookup[id])
        .then(x => {
          if (x instanceof Tradfri.Group) {
            return x.toggle(setOn);
          } else {
            throw new Error(`Didn't find group "${id}"`);
          }
        });
    },
  };

  function convert(x: Tradfri.Group | Tradfri.Accessory): Device | null {
    if (x instanceof Tradfri.Group) {
      tradfriLookup[x.instanceId] = x;
      return createGroup(x);
    } else if (x instanceof Tradfri.Accessory) {
      if (x.type === Tradfri.AccessoryTypes.lightbulb) {
        tradfriLookup[x.instanceId] = x;
        return createLight(x);
      }
      return null;
    }
    log.warn("Don't know what to do with:", x);
    return null;
  }

  function update(object: Device | null) {
    if (!object) {
      log.debug('Ignoring empty world update');
      return;
    }
    log.debug(`${object.type}#${object.id} changed`);
    state = { ...state, objects: { ...state.objects, [object.id]: object } };
    events.emit('change', state);
  }
}
