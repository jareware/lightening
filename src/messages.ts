import * as t from 'io-ts'

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
        id: t.number,
        members: t.array(
          t.type({
            endpoint: t.number,
            ieee_address: t.string,
          }),
        ),
      }),
    ),
  },
  'GroupsInitMessage',
)

export type LightStatusMessage = t.TypeOf<typeof LightStatusMessage>
export const LightStatusMessage = t.type(
  {
    topic: t.tuple([t.literal('zigbee2mqtt'), t.string]),
    body: t.type({
      brightness: t.number,
      state: t.union([t.literal('ON'), t.literal('OFF')]),
    }),
  },
  'LightStatusMessage',
)

export type IncomingMessage = t.TypeOf<typeof IncomingMessage>
export const IncomingMessage = t.union(
  [GroupsInitMessage, LightStatusMessage],
  'IncomingMessage',
)
