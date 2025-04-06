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
    body: t.type({
      state: t.union([t.literal('ON'), t.literal('OFF')]),
      brightness: t.number,
    }),
  },
  'LightStateMessage',
)

export type ButtonPressMessage = t.TypeOf<typeof ButtonPressMessage>
export const ButtonPressMessage = t.type(
  {
    topic: t.tuple([t.literal('zigbee2mqtt'), t.string]),
    body: t.type({
      action: t.union([
        // Regular wall switches send these:
        t.literal('arrow_left_click'),
        t.literal('arrow_left_hold'),
        t.literal('arrow_left_release'),
        t.literal('arrow_right_click'),
        t.literal('arrow_right_hold'),
        t.literal('arrow_right_release'),
        t.literal('brightness_down_click'),
        t.literal('brightness_down_hold'),
        t.literal('brightness_down_release'),
        t.literal('brightness_up_click'),
        t.literal('brightness_up_hold'),
        t.literal('brightness_up_release'),
        t.literal('toggle'),
        t.literal('toggle_hold'),
        // Square I/O buttons send these:
        t.literal('on'), // Quick press
        t.literal('off'), // Quick press
        t.literal('brightness_move_up'), // Long press start
        t.literal('brightness_move_down'), // Long press start
        t.literal('brightness_stop'), // Long press end
        // Scene buttons send these:
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

export type PowerStateMessage = t.TypeOf<typeof PowerStateMessage>
export const PowerStateMessage = t.type(
  {
    topic: t.tuple([t.literal('zigbee2mqtt'), t.string]),
    body: t.type({
      state: t.union([t.literal('ON'), t.literal('OFF')]),
    }),
  },
  'PowerStateMessage',
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
    PowerStateMessage,
  ],
  'IncomingMessage',
)
