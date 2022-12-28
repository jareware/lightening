import _ from 'lodash'
import { CommandModule } from 'src/server/command'
import { DebugOutput } from 'src/server/debug'
import { PromiseOf } from 'src/server/types'
import { isModel } from 'src/server/utils'
import { WebServer } from 'src/server/web'
import config from 'src/shared/config'
import {
  DevicesInitMessage,
  GroupsInitMessage,
  IncomingMessage,
  LightStateMessage,
  PowerStateMessage,
} from 'src/shared/types/messages'
import { getDeviceConfig } from 'src/shared/utils/config'
import { StateMap } from 'src/shared/utils/state'

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

  let state: StateMap = {}

  setTimeout(checkMissingState, 5000)

  // Return public API:
  return {
    processIncomingMessage,
    setScene: _.noop,
  }

  async function processIncomingMessage(message: IncomingMessage) {
    if (
      isModel(DevicesInitMessage)(message) ||
      isModel(GroupsInitMessage)(message)
    ) {
      processIncomingInitMessage(message)
    } else if (isModel(LightStateMessage)(message)) {
      processIncomingLightStateMessage(message)
    } else if (isModel(PowerStateMessage)(message)) {
      processIncomingPowerStateMessage(message)
    } else {
      // TODO: assertExhausted(message)
    }
    web.sendAppStateIfNeeded(state)
  }

  async function processIncomingInitMessage(
    message: DevicesInitMessage | GroupsInitMessage,
  ) {
    if (isModel(DevicesInitMessage)(message)) initDevices = message
    if (isModel(GroupsInitMessage)(message)) initGroups = message
  }

  async function processIncomingLightStateMessage(message: LightStateMessage) {
    const [, name] = message.topic
    const device = getDeviceConfig(name)
    if (device?.type !== 'Light') return
    state = {
      ...state,
      [device.name]: {
        brightness: message.body.state === 'ON' ? message.body.brightness : 0,
        updated: new Date(),
      },
    }
  }

  async function processIncomingPowerStateMessage(message: PowerStateMessage) {
    const device = getDeviceConfig(message)
    if (device?.type !== 'PowerPlug') return
    state = {
      ...state,
      [device.name]: {
        powerOn: message.body.state === 'ON',
        updated: new Date(),
      },
    }
  }

  function checkMissingState() {
    const groups = initGroups?.body
    if (!groups)
      throw new Error('Init groups not available when checking missing state')
    Object.values(config).forEach(device => {
      if (!state[device.name]) {
        const isGroup = !!groups.find(
          group => group.friendly_name === device.name,
        )
        command.setOptions(isGroup ? 'group' : 'device', device.name, {
          retain: true, // if a group/device is still missing its state, it's possible it's "retained" option is not set → try to fix it, so it'll work on next startup
        })
      }
    })
  }
}
