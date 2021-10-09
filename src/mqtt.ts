import MQTT from 'async-mqtt'
import { IncomingMessage } from 'src/messages'
import { PromiseOf } from 'src/types'
import { parseAsModel } from 'src/utils'

type Callback = (message: IncomingMessage) => Promise<void>

/**
 * @see https://www.zigbee2mqtt.io/information/mqtt_topics_and_message_structure.html
 */
export type MqttClient = PromiseOf<ReturnType<typeof createMqttClient>>
export async function createMqttClient(mqttAddress: string) {
  const mqtt = await MQTT.connectAsync(mqttAddress)
  const callbacks: Callback[] = []

  // Add handler for incoming messages:
  mqtt.on('message', async (topic, message) => {
    try {
      const parsed = parseAsModel(IncomingMessage)({
        topic: topic.split('/'),
        body: JSON.parse(message.toString()),
      })
      console.log(`Incoming message (${topic})`)
      for (const callback of callbacks) {
        await callback(parsed)
      }
    } catch (err) {
      console.log(`Incoming unparseable message (${topic})`)
    }
  })

  // Start a wildcard subscription to anything happening under the "zigbee2mqtt" topic:
  await mqtt.subscribe('zigbee2mqtt/#')

  // Return public API:
  return {
    onIncomingMessage(callback: Callback) {
      callbacks.push(callback)
    },

    async publishOutgoingMessage(
      topic: string[],
      message: Record<string, unknown>,
    ) {
      console.log(`Outgoing message (${topic})`)
      await mqtt.publish(topic.join('/'), JSON.stringify(message))
    },
  }
}
