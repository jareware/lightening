import MQTT from 'async-mqtt'
import _ from 'lodash'
import { Table, printTable } from 'console-table-printer'
import {
  GroupsInitMessage,
  IncomingMessage,
  LightStatusMessage,
} from 'src/messages'
import { assertExhausted, isModel, parseAsModel } from 'src/utils'
import { PromiseOf } from 'src/types'

export type App = PromiseOf<ReturnType<typeof createApp>>

type Devices = Record<
  string,
  { brightness: number; state: 'ON' | 'OFF'; lastUpdateAt: Date }
>

/**
 * @see https://github.com/Automattic/cli-table
 * @see https://www.zigbee2mqtt.io/information/mqtt_topics_and_message_structure.html
 */
export async function createApp(mqttAddress: string) {
  const mqtt = await MQTT.connectAsync(mqttAddress)
  const devices: Devices = {}
  const app = { mqtt, devices }

  mqtt.on('message', (topic, message) => {
    try {
      const parsed = parseAsModel(IncomingMessage)({
        topic: topic.split('/'),
        body: JSON.parse(message.toString()),
      })
      console.log(`Received message (${topic})`)
      processIncomingMessage(app, parsed)
    } catch (err) {
      console.log(`Received unparseable message (${topic})`)
    }
  })

  await mqtt.subscribe('zigbee2mqtt/#')

  return app
}

async function processIncomingMessage(app: App, message: IncomingMessage) {
  if (isModel(GroupsInitMessage)(message)) {
    for (const name of message.body
      .filter(g => g.members.length > 0)
      .map(g => g.friendly_name))
      await app.mqtt.publish(`zigbee2mqtt/${name}/get`, '{"state":""}') // request the current state of the devices in each group
  } else if (isModel(LightStatusMessage)(message)) {
    console.log('Light status update:', message)
    app.devices = {
      ...app.devices,
      [message.topic[1]]: { ...message.body, lastUpdateAt: new Date() },
    }
    const table = new Table({
      columns: [
        { name: 'Name', alignment: 'left' },
        { name: 'State', alignment: 'center' },
        { name: 'Brightness', alignment: 'right' },
        { name: 'Last update at', alignment: 'right' },
      ],
    })
    _.chain(app.devices)
      .toPairs()
      .sortBy(([key]) => key)
      .forEach(([key, val]) => {
        const sinceLastUpdate = (Date.now() - val.lastUpdateAt.getTime()) / 1000
        table.addRow(
          {
            Name: key,
            State: val.state,
            Brightness: val.brightness,
            'Last update at': sinceLastUpdate.toFixed(0) + ' sec ago',
          },
          { color: sinceLastUpdate < 1 ? 'cyan' : undefined },
        )
      })
      .value()
    table.printTable()
  } else {
    assertExhausted(message)
  }
}
