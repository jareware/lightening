import MQTT from 'async-mqtt'
import _ from 'lodash'
import { Table, printTable } from 'console-table-printer'
import {
  DevicesInitMessage,
  GroupsInitMessage,
  IncomingMessage,
  DeviceStatusMessage,
  ButtonPressMessage,
} from 'src/messages'
import { assertExhausted, isModel, parseAsModel } from 'src/utils'
import { PromiseOf } from 'src/types'
import { MqttClient } from 'src/mqtt'
import { CommandModule } from 'src/command'
import { DebugOutput } from 'src/debug'

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
      if (lightGroups) debug.logAppStateIfNeeded(lightGroups)
    } else if (isModel(DeviceStatusMessage)(message)) {
      processIncomingDeviceStatusMessage(message)
      if (lightGroups) debug.logAppStateIfNeeded(lightGroups)
    } else if (isModel(ButtonPressMessage)(message)) {
      processIncomingButtonPressMessage(message)
      if (lightGroups) debug.logAppStateIfNeeded(lightGroups)
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

  async function processIncomingDeviceStatusMessage(
    message: DeviceStatusMessage,
  ) {
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
  }

  async function processIncomingButtonPressMessage(
    message: ButtonPressMessage,
  ) {
    const [, friendlyName] = message.topic
    if (message.body.action === 'brightness_move_up') {
      await setScene('Day')
    } else if (message.body.action === 'on') {
      switch (friendlyName) {
        case 'nappi_night':
          await setScene('Night')
          break
        case 'nappi_off':
          await setScene('Off')
          break
        case 'nappi_tv':
          await setScene('TV')
          break
      }
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
  | 'keittiön_työtasot_group'
  | 'kylppäri_group'
  | 'makkari_group'
  | 'näytön_taustavalo_group'
  | 'olohuone_group'
  | 'parveke_group'
  | 'pikkuvessa_group'
  | 'ruokapöytä_group'
  | 'telkkarin_taustavalo_group'
  | 'työnurkka_group'
  | 'vaatehuone_group'
  | 'yövalot_group'

type Scene = { [key in LightGroupName]: { brightness: number } }
type Scenes = { [key: string]: Scene | undefined }

const off = { brightness: 0 }
const dim = { brightness: 1 }
const full = { brightness: 254 }

const scenes: Scenes = {
  Off: {
    eteinen_group: off,
    keittiö_group: off,
    keittiön_työtasot_group: off,
    kylppäri_group: off,
    makkari_group: off,
    näytön_taustavalo_group: off,
    olohuone_group: off,
    parveke_group: off,
    pikkuvessa_group: off,
    ruokapöytä_group: off,
    telkkarin_taustavalo_group: off,
    työnurkka_group: off,
    vaatehuone_group: off,
    yövalot_group: off,
  },
  Day: {
    eteinen_group: full,
    keittiö_group: full,
    keittiön_työtasot_group: full,
    kylppäri_group: full,
    makkari_group: full,
    näytön_taustavalo_group: off,
    olohuone_group: full,
    parveke_group: full,
    pikkuvessa_group: full,
    ruokapöytä_group: full,
    telkkarin_taustavalo_group: off,
    työnurkka_group: full,
    vaatehuone_group: full,
    yövalot_group: off,
  },
  Night: {
    eteinen_group: off,
    keittiö_group: off,
    keittiön_työtasot_group: dim,
    kylppäri_group: dim,
    makkari_group: off,
    näytön_taustavalo_group: off,
    olohuone_group: off,
    parveke_group: off,
    pikkuvessa_group: dim,
    ruokapöytä_group: off,
    telkkarin_taustavalo_group: off,
    työnurkka_group: off,
    vaatehuone_group: dim,
    yövalot_group: dim,
  },
  TV: {
    eteinen_group: off,
    keittiö_group: off,
    keittiön_työtasot_group: dim,
    kylppäri_group: dim,
    makkari_group: dim,
    näytön_taustavalo_group: off,
    olohuone_group: off,
    parveke_group: off,
    pikkuvessa_group: dim,
    ruokapöytä_group: dim,
    telkkarin_taustavalo_group: { brightness: 100 },
    työnurkka_group: off,
    vaatehuone_group: dim,
    yövalot_group: dim,
  },
}
