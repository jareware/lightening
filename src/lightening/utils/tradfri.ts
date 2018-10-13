import { TradfriClient, Accessory, Group, AccessoryTypes } from 'node-tradfri-client';
import { NO_LOGGING } from 'lightening/utils/logging';
import { Config } from 'lightening/utils/config';
import { EventEmitter } from 'events';
import { WorldState, TradfriObject, createLight } from 'lightening/utils/model';

interface WorldStateEmitter extends EventEmitter {
  on(event: 'change', callback: (newWorldState: WorldState) => void): this;
}

export function createTradfriClient(config: Config, log = NO_LOGGING) {
  log.info('Creating Trådfri client', config);

  const tradfri = new TradfriClient(config.LIGHTENING_TRADFRI_HOSTNAME);
  const events: WorldStateEmitter = new EventEmitter();

  let world: WorldState = {
    objects: {},
  };

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
    })
    .catch(err => console.log('ERROR', err));

  return { events };

  function convert(x: Group | Accessory): TradfriObject | null {
    if (x instanceof Group) {
      return null;
    } else if (x instanceof Accessory) {
      if (x.type === AccessoryTypes.lightbulb) return createLight(x);
      return null;
    }
    log.warn("Don't know what to do with:", x);
    return null;
  }

  function update(object: TradfriObject | null) {
    if (!object) {
      log.debug('Ignoring empty world update');
      return;
    }
    log.debug(`Object "${object.id}" changed`);
    world = { ...world, objects: { ...world.objects, [object.id]: object } };
    events.emit('change', world);
  }
}
