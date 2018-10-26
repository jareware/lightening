import { readConfigFromEnv } from 'lightening/shared/utils/config';
import { TradfriClient, Accessory, Group, AccessoryTypes } from 'node-tradfri-client';
import Table from 'cli-table';
import { get } from 'lodash';
import { isUndefined } from 'util';

const config = readConfigFromEnv();

console.log('Config loaded', config);

const tradfri = new TradfriClient(config.LIGHTENING_TRADFRI_HOSTNAME);
const devices: { [id: string]: Accessory } = {};
const groups: { [id: string]: Group } = {};
let lastChangedId = 0;

/*
discoverGateway()
  .then(res => console.log('SUCCESS', res))
  .catch(err => console.log('ERROR', err));
*/

console.log('Connecting...');
tradfri
  .connect(
    config.LIGHTENING_TRADFRI_IDENTITY,
    config.LIGHTENING_TRADFRI_PSK,
  )
  .then(() => {
    console.log('Connected!');
    tradfri
      .on('group updated', group => {
        groups[group.instanceId] = group;
        lastChangedId = group.instanceId;
        render();
      })
      .observeGroupsAndScenes();
    tradfri
      .on('device updated', device => {
        devices[device.instanceId] = device;
        lastChangedId = device.instanceId;
        render();
      })
      .observeDevices();
  })
  .catch(err => console.log('ERROR', err));

function render() {
  console.log('\n\n\n');
  const table = new Table({
    chars: { mid: '', 'left-mid': '', 'mid-mid': '', 'right-mid': '' },
    head: [
      // Note: Order must match the push() calls below
      'changed',
      'type',
      'id',
      'name',
      'onOff',
      'dimmer',
      'color',
      'alive',
      'power',
      'battery',
      'devices',
    ],
  });
  Object.keys(groups).forEach(instanceId => {
    const group: Group = groups[instanceId];
    table.push(
      [
        // Note: Order must match the head setup above
        group.instanceId === lastChangedId ? 'CHANGED' : '',
        getReadableType(group),
        group.instanceId,
        group.name,
        group.onOff,
        group.dimmer,
        '',
        '',
        '',
        '',
        group.deviceIDs.join(', '),
      ].map(x => (isUndefined(x) ? '' : x)),
    );
  });
  Object.keys(devices).forEach(instanceId => {
    const device: Accessory = devices[instanceId];
    table.push(
      [
        // Note: Order must match the head setup above
        device.instanceId === lastChangedId ? 'CHANGED' : '',
        getReadableType(device),
        device.instanceId,
        device.name,
        get(device, 'lightList[0].onOff'),
        get(device, 'lightList[0].dimmer'),
        get(device, 'lightList[0].color'),
        device.alive,
        device.deviceInfo.power,
        device.deviceInfo.battery,
        '',
      ].map(x => (isUndefined(x) ? '' : x)),
    );
  });
  console.log(table.toString());
}

type ObjectType = 'GROUP' | 'LIGHT' | 'REMOTE' | 'SENSOR' | 'UNKNOWN';

function getReadableType(x: Accessory | Group): ObjectType {
  if (x instanceof Accessory) {
    if (x.type === AccessoryTypes.lightbulb) return 'LIGHT';
    if (x.type === AccessoryTypes.remote) return 'REMOTE';
    if (x.type === AccessoryTypes.motionSensor) return 'SENSOR';
  } else if (x instanceof Group) {
    return 'GROUP';
  }
  return 'UNKNOWN';
}

process.on('SIGINT', () => {
  console.log('Exiting cleanly...');
  tradfri.destroy();
});
