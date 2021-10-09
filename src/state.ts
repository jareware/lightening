import MQTT from 'async-mqtt'
import _ from 'lodash'
import { Table, printTable } from 'console-table-printer'
import {
  DevicesInitMessage,
  GroupsInitMessage,
  IncomingMessage,
  DeviceStatusMessage,
} from 'src/messages'
import { assertExhausted, isModel, parseAsModel } from 'src/utils'
import { PromiseOf } from 'src/types'
import { MqttClient } from 'src/mqtt'
import { CommandModule } from 'src/command'

type LightGroups = Array<{
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
export async function createStateMachine(command: CommandModule) {
  let initDevices: DevicesInitMessage | undefined
  let initGroups: GroupsInitMessage | undefined
  let lightGroups: LightGroups | undefined

  setInterval(queryMissingCurrentState, 500)

  // Return public API:
  return {
    processIncomingMessage,
  }

  async function processIncomingMessage(message: IncomingMessage) {
    if (
      isModel(DevicesInitMessage)(message) ||
      isModel(GroupsInitMessage)(message)
    ) {
      processIncomingInitMessage(message)
      printStateToConsole()
    } else if (isModel(DeviceStatusMessage)(message)) {
      processIncomingDeviceStatusMessage(message)
      printStateToConsole()
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
    lightGroups = lightGroups?.map(group => ({
      ...group,
      members: group.members.map(light =>
        light.friendlyName === message.topic[1]
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

  async function queryMissingCurrentState() {
    const missingCurrentState = lightGroups?.find(group =>
      group.members.some(light => !light.latestReceivedState),
    )
    if (missingCurrentState) command.queryCurrentState(missingCurrentState)
  }

  /**
   * @see https://github.com/Automattic/cli-table
   */
  function printStateToConsole() {
    const table = new Table({
      columns: [
        { name: 'Group', alignment: 'left' },
        { name: 'Light', alignment: 'left' },
        { name: 'State', alignment: 'center' },
        { name: 'Brightness', alignment: 'right' },
        { name: 'Updated', alignment: 'right' },
      ],
    })
    _.sortBy(lightGroups, group => group.friendlyName).forEach(group =>
      _.sortBy(group.members, light => light.friendlyName).forEach(
        (light, i) => {
          const sinceLastUpdate = light.latestReceivedState
            ? (Date.now() - light.latestReceivedState?.updated.getTime()) / 1000
            : null
          table.addRow(
            {
              Group: i === 0 ? group.friendlyName : '',
              Light: light.friendlyName,
              State: light.latestReceivedState?.state ?? '',
              Brightness: light.latestReceivedState?.brightness ?? '',
              Updated:
                sinceLastUpdate === null
                  ? ''
                  : sinceLastUpdate.toFixed(0) + ' sec ago',
            },
            {
              color:
                sinceLastUpdate !== null && sinceLastUpdate < 1
                  ? 'cyan'
                  : undefined,
            },
          )
        },
      ),
    )
    table.printTable()
  }
}
