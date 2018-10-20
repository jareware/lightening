import * as Tradfri from 'node-tradfri-client'; // @see https://github.com/AlCalzone/node-tradfri-client
import { NO_LOGGING } from 'lightening/utils/logging';
import { Config } from 'lightening/utils/config';
import { EventEmitter } from 'events';
import { WorldState, TradfriObject, createLight, createGroup } from 'lightening/utils/model';

interface WorldStateEmitter extends EventEmitter {
  on(event: 'change', callback: (newWorldState: WorldState) => void): this;
}

export function createTradfriClient(config: Config, log = NO_LOGGING) {
  log.info('Creating Trådfri client', config);

  const tradfri = new Tradfri.TradfriClient(config.LIGHTENING_TRADFRI_HOSTNAME);
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

  return { events };

  function convert(x: Tradfri.Group | Tradfri.Accessory): TradfriObject | null {
    if (x instanceof Tradfri.Group) {
      return createGroup(x);
    } else if (x instanceof Tradfri.Accessory) {
      if (x.type === Tradfri.AccessoryTypes.lightbulb) return createLight(x);
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
