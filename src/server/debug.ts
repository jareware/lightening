import { Table } from 'console-table-printer'
import { createWriteStream } from 'fs'
import _ from 'lodash'
import { LightGroups } from 'src/server/state'
import { PromiseOf } from 'src/server/types'

export type DebugOutput = PromiseOf<ReturnType<typeof createDebugOutput>>
export async function createDebugOutput(
  logFile = __dirname + '/../lightening.log',
) {
  let logStream = createWriteStream(logFile, { flags: 'w' })
  let prevLightGroups: LightGroups

  return {
    logIncomingMessage,
    logOutgoingMessage,
    logAppState,
    logAppStateIfNeeded,
  }

  function logIncomingMessage(topic: string, message: unknown) {
    logMqttMessage('INCOMING', topic, message)
  }

  function logOutgoingMessage(topic: string, message: unknown) {
    logMqttMessage('OUTGOING', topic, message)
  }

  function logMqttMessage(direction: string, topic: string, message: unknown) {
    console.log(`${direction} message: ${topic}`)
    try {
      message = Buffer.isBuffer(message) ? message.toString() : String(message)
      message = JSON.parse(message as any)
    } catch (err) {}
    logStream.write(
      JSON.stringify(
        {
          direction,
          timestamp: new Date().toISOString(),
          topic,
          message,
        },
        null,
        2,
      ) + '\n\n',
      _.noop,
    )
  }

  function logAppStateIfNeeded(lightGroups: LightGroups) {
    if (_.isEqual(prevLightGroups, lightGroups)) return
    logAppState(lightGroups)
    prevLightGroups = lightGroups
  }

  /**
   * @see https://github.com/Automattic/cli-table
   */
  function logAppState(lightGroups: LightGroups) {
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
