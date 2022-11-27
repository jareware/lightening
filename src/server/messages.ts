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

export type LightStateMessage = t.TypeOf<typeof LightStateMessage>
export const LightStateMessage = t.type(
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
  'LightStateMessage',
)

export type ButtonPressMessage = t.TypeOf<typeof ButtonPressMessage>
export const ButtonPressMessage = t.type(
  {
    topic: t.tuple([t.literal('zigbee2mqtt'), t.string]),
    body: t.type({
      action: t.union([
        t.literal('on'), // Button fast press
        t.literal('brightness_move_up'), // Button long press started
        t.literal('brightness_stop'), // Button long press finished
      ]),
    }),
  },
  'ButtonPressMessage',
)

export type MotionSensorMessage = t.TypeOf<typeof MotionSensorMessage>
export const MotionSensorMessage = t.type(
  {
    topic: t.tuple([t.literal('zigbee2mqtt'), t.string]),
    body: t.type({
      illuminance_above_threshold: t.boolean,
      occupancy: t.boolean,
    }),
  },
  'MotionSensorMessage',
)

export type ContactSensorMessage = t.TypeOf<typeof ContactSensorMessage>
export const ContactSensorMessage = t.type(
  {
    topic: t.tuple([t.literal('zigbee2mqtt'), t.string]),
    body: t.type({
      contact: t.boolean,
    }),
  },
  'ContactSensorMessage',
)

export type IncomingMessage = t.TypeOf<typeof IncomingMessage>
export const IncomingMessage = t.union(
  [
    DevicesInitMessage,
    GroupsInitMessage,
    LightStateMessage,
    ButtonPressMessage,
    MotionSensorMessage,
    ContactSensorMessage,
  ],
  'IncomingMessage',
)
