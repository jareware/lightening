import * as t from 'io-ts'

export type DevicesInitMessage = t.TypeOf<typeof DevicesInitMessage>
export const DevicesInitMessage = t.type(
  {
    topic: t.tuple([
      t.literal('zigbee2mqtt'),
      t.literal('bridge'),
      t.literal('devices'),
    ]),
    body: t.array(
      t.type({
        ieee_address: t.string,
        friendly_name: t.string,
      }),
    ),
  },
  'DevicesInitMessage',
)

export type GroupsInitMessage = t.TypeOf<typeof GroupsInitMessage>
export const GroupsInitMessage = t.type(
  {
    topic: t.tuple([
      t.literal('zigbee2mqtt'),
      t.literal('bridge'),
      t.literal('groups'),
    ]),
    body: t.array(
      t.type({
        friendly_name: t.string,
        members: t.array(
          t.type({
            ieee_address: t.string,
          }),
        ),
      }),
    ),
  },
  'GroupsInitMessage',
)

export type DeviceStatusMessage = t.TypeOf<typeof DeviceStatusMessage>
export const DeviceStatusMessage = t.type(
  {
    topic: t.tuple([t.literal('zigbee2mqtt'), t.string]),
    body: t.intersection([
      t.type({
        state: t.union([t.literal('ON'), t.literal('OFF')]),
      }),
      t.partial({
        brightness: t.number,
      }),
    ]),
  },
  'DeviceStatusMessage',
)

export type IncomingMessage = t.TypeOf<typeof IncomingMessage>
export const IncomingMessage = t.union(
  [DevicesInitMessage, GroupsInitMessage, DeviceStatusMessage],
  'IncomingMessage',
)
