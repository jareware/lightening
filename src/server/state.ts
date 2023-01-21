import _ from 'lodash'
import { CommandModule } from 'src/server/command'
import { DebugOutput } from 'src/server/debug'
import { PromiseOf } from 'src/server/types'
import { isModel } from 'src/server/utils'
import { WebServer } from 'src/server/web'
import config from 'src/shared/config'
import {
  ContactSensorMessage,
  DevicesInitMessage,
  GroupsInitMessage,
  IncomingMessage,
  LightStateMessage,
  MotionSensorMessage,
  PowerStateMessage,
} from 'src/shared/types/messages'
import { getDeviceConfig } from 'src/shared/utils/config'
import {
  getDeviceState,
  setDeviceState,
  StateMap,
} from 'src/shared/utils/state'

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
  setInterval(checkAutoTurnOff, 5000)

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
    } else if (isModel(ContactSensorMessage)(message)) {
      processIncomingContactSensorMessage(message)
    } else if (isModel(MotionSensorMessage)(message)) {
      processIncomingMotionSensorMessage(message)
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
    const prevState = getDeviceState(state, device.name)
    const newBrightness =
      message.body.state === 'ON'
        ? message.body.brightness || 1 // if light is "ON" at brightness 0, consider it 1
        : 0
    state = setDeviceState(state, device.name, {
      brightness: newBrightness,
      lastSetOnAt: newBrightness > 0 ? new Date() : prevState?.lastSetOnAt,
    })
  }

  async function processIncomingPowerStateMessage(message: PowerStateMessage) {
    const device = getDeviceConfig(message)
    if (device?.type !== 'PowerPlug') return
    state = setDeviceState(state, device.name, {
      powerOn: message.body.state === 'ON',
    })
  }

  async function processIncomingContactSensorMessage(
    message: ContactSensorMessage,
  ) {
    const device = getDeviceConfig(message)
    if (device?.type !== 'DoorSensor') return
    const prevState = getDeviceState(state, device.name)
    const doorOpen = !message.body.contact
    state = setDeviceState(state, device.name, {
      doorOpen,
    })
    if (!prevState) return // this is the init for this device → don't react to changes, as they're not real changes
    if ('controls' in device && device.controls) {
      const newBrightness = doorOpen ? device.controlsBrightness ?? 254 : 0
      device.controls.forEach(name => {
        const controlledDevice = getDeviceConfig(name)
        if (
          controlledDevice?.type === 'Light' &&
          !(controlledDevice.turnOffAfterMinutes && newBrightness === 0)
        ) {
          command.setLightState(controlledDevice, newBrightness)
        }
        if (controlledDevice?.type === 'PowerPlug')
          command.setPowerState(controlledDevice, doorOpen)
      })
    }
  }

  async function processIncomingMotionSensorMessage(
    message: MotionSensorMessage,
  ) {
    const device = getDeviceConfig(message)
    if (device?.type !== 'MotionSensor') return
    const prevState = getDeviceState(state, device.name)
    const motionDetected = message.body.occupancy
    state = setDeviceState(state, device.name, {
      motionDetected,
    })
    if (!prevState) return // this is the init for this device → don't react to changes, as they're not real changes
    if ('controls' in device && device.controls) {
      const newBrightness = motionDetected
        ? device.controlsBrightness ?? 254
        : 0
      device.controls.forEach(name => {
        const controlledDevice = getDeviceConfig(name)
        if (
          controlledDevice?.type === 'Light' &&
          !(controlledDevice.turnOffAfterMinutes && newBrightness === 0)
        ) {
          command.setLightState(controlledDevice, newBrightness)
        }
        if (controlledDevice?.type === 'PowerPlug')
          command.setPowerState(controlledDevice, motionDetected)
      })
    }
  }

  function checkMissingState() {
    const groups = initGroups?.body
    if (!groups)
      throw new Error('Init groups not available when checking missing state')
    Object.values(config).forEach(device => {
      if (state[device.name]) return
      console.log(
        `Device "${device.name}" is still missing state → trying to set retained`,
      )
      const isGroup = !!groups.find(
        group => group.friendly_name === device.name,
      )
      command.setOptions(isGroup ? 'group' : 'device', device.name, {
        retain: true, // if a group/device is still missing its state, it's possible it's "retained" option is not set → try to fix it, so it'll work on next startup
      })
    })
  }

  function checkAutoTurnOff() {
    Object.values(config).forEach(device => {
      if (!('turnOffAfterMinutes' in device) || !device.turnOffAfterMinutes)
        return
      const s = getDeviceState(state, device.name)
      if (!s || !('lastSetOnAt' in s) || !s.lastSetOnAt) return
      const { lastSetOnAt } = s
      const { turnOffAfterMinutes } = device
      if (lastSetOnAt.getTime() + turnOffAfterMinutes * 60 * 1000 > Date.now())
        return
      if (!s.brightness) return
      command.setLightState(device, 0)
    })
  }
}
