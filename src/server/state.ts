import { CommandModule } from 'src/server/command'
import { DebugOutput } from 'src/server/debug'
import {
  ButtonPressMessage,
  DevicesInitMessage,
  GroupsInitMessage,
  IncomingMessage,
  LightStateMessage,
  MotionSensorMessage,
} from 'src/server/messages'
import { PromiseOf } from 'src/server/types'
import { assertExhausted, isModel } from 'src/server/utils'
import { WebServer } from 'src/server/web'

export type LightGroups = Array<{
  friendlyName: string
  members: Array<{
    friendlyName: string
    ieeeAddress: string
    latestReceivedState?: {
      brightness: number
      state: 'ON' | 'OFF'
      updated: Date
    }
  }>
}>

export type StateMachine = PromiseOf<ReturnType<typeof createStateMachine>>
export async function createStateMachine(
  command: CommandModule,
  debug: DebugOutput,
  web: WebServer,
) {
  let initDevices: DevicesInitMessage | undefined
  let initGroups: GroupsInitMessage | undefined
  let lightGroups: LightGroups | undefined

  setInterval(queryMissingCurrentState, 500)

  // Return public API:
  return {
    processIncomingMessage,
    setScene,
  }

  async function processIncomingMessage(message: IncomingMessage) {
    if (
      isModel(DevicesInitMessage)(message) ||
      isModel(GroupsInitMessage)(message)
    ) {
      processIncomingInitMessage(message)
      if (lightGroups) {
        debug.logAppStateIfNeeded(lightGroups)
        web.sendAppStateIfNeeded(lightGroups)
      }
    } else if (isModel(LightStateMessage)(message)) {
      processIncomingLightStateMessage(message)
      if (lightGroups) {
        debug.logAppStateIfNeeded(lightGroups)
        web.sendAppStateIfNeeded(lightGroups)
      }
    } else if (isModel(ButtonPressMessage)(message)) {
      processIncomingButtonPressMessage(message)
      if (lightGroups) {
        debug.logAppStateIfNeeded(lightGroups)
        web.sendAppStateIfNeeded(lightGroups)
      }
    } else if (isModel(MotionSensorMessage)(message)) {
      processIncomingMotionSensorMessage(message)
      if (lightGroups) {
        debug.logAppStateIfNeeded(lightGroups)
        web.sendAppStateIfNeeded(lightGroups)
      }
    } else {
      assertExhausted(message)
    }
  }

  async function processIncomingInitMessage(
    message: DevicesInitMessage | GroupsInitMessage,
  ) {
    if (isModel(DevicesInitMessage)(message)) initDevices = message
    if (isModel(GroupsInitMessage)(message)) initGroups = message

    // If both init messages have been received, set up initial state:
    if (initDevices && initGroups) {
      const devices = initDevices,
        groups = initGroups
      lightGroups = groups.body
        .filter(group => group.members.length) // ignore empty groups (there are some built-in ones at least)
        .map(group => ({
          friendlyName: group.friendly_name,
          members: devices.body
            .filter(device =>
              group.members
                .map(m => m.ieee_address)
                .includes(device.ieee_address),
            )
            .map(device => ({
              ieeeAddress: device.ieee_address,
              friendlyName: device.friendly_name,
            })),
        }))
    }
  }

  async function processIncomingLightStateMessage(message: LightStateMessage) {
    const [, friendlyName] = message.topic
    lightGroups = lightGroups?.map(group => ({
      ...group,
      members: group.members.map(light =>
        light.friendlyName === friendlyName
          ? {
              ...light,
              latestReceivedState: {
                state: message.body.state,
                brightness: message.body.brightness ?? 0,
                updated: new Date(),
              },
            }
          : light,
      ),
    }))

    // TODO: DELME
    if (typeof message.body.brightness !== 'number') {
      console.log('OBS: Got LightStateMessage without brightness')
    }
  }

  async function processIncomingButtonPressMessage(
    message: ButtonPressMessage,
  ) {
    const [, friendlyName] = message.topic
    if (message.body.action === 'brightness_move_up') {
      await setScene('Day')
    } else if (message.body.action === 'on') {
      switch (friendlyName) {
        case 'button_night':
          await setScene('Night')
          break
        case 'button_off':
          await setScene('Off')
          break
        case 'button_tv':
          await setScene('TV')
          break
      }
    }
  }

  async function processIncomingMotionSensorMessage(
    message: MotionSensorMessage,
  ) {
    const [, friendlyName] = message.topic
    if (friendlyName === 'motion_eteinen') {
      command.setNewLightState(
        'siivouskaappi_1',
        message.body.occupancy ? 254 : 0,
        1,
      )
    }
  }

  async function queryMissingCurrentState() {
    const missingCurrentState = lightGroups?.find(group =>
      group.members.some(light => !light.latestReceivedState),
    )
    if (missingCurrentState) command.queryCurrentState(missingCurrentState)
  }

  async function setScene(name: string) {
    if (!lightGroups) return // not init'd yet
    const scene = scenes[name]
    if (!scene) return
    const groupNames: LightGroupName[] = Object.keys(scene) as any
    for (let i = 0; i < 3; i++) {
      for (const name of groupNames) {
        await command.setNewLightStateIfNeeded(
          name,
          scene[name].brightness,
          lightGroups,
        )
      }
    }
  }
}

type LightGroupName =
  | 'eteinen_group'
  | 'keittiö_group'
  | 'ruokapöytä_group'
  | 'telkkari_group'
  | 'työhuone_group'
  | 'olkkari_group'
  | 'pikkuvessa_group'
  | 'kylppäri_group'

type Scene = { [key in LightGroupName]: { brightness: number } }
type Scenes = { [key: string]: Scene | undefined }

const off = { brightness: 0 }
const dim = { brightness: 30 }
const full = { brightness: 254 }

const scenes: Scenes = {
  Off: {
    eteinen_group: off,
    keittiö_group: off,
    ruokapöytä_group: off,
    telkkari_group: off,
    työhuone_group: off,
    olkkari_group: off,
    pikkuvessa_group: off,
    kylppäri_group: off,
  },
  Day: {
    eteinen_group: full,
    keittiö_group: full,
    ruokapöytä_group: full,
    telkkari_group: off,
    työhuone_group: full,
    olkkari_group: full,
    pikkuvessa_group: full,
    kylppäri_group: full,
  },
  Night: {
    eteinen_group: off,
    keittiö_group: dim,
    ruokapöytä_group: dim,
    telkkari_group: off,
    työhuone_group: dim,
    olkkari_group: dim,
    pikkuvessa_group: dim,
    kylppäri_group: dim,
  },
  TV: {
    eteinen_group: off,
    keittiö_group: off,
    ruokapöytä_group: dim,
    telkkari_group: { brightness: 175 },
    työhuone_group: off,
    olkkari_group: dim,
    pikkuvessa_group: dim,
    kylppäri_group: dim,
  },
}
