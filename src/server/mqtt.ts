import MQTT from 'async-mqtt'
import { DebugOutput } from 'src/server/debug'
import { IncomingMessage } from 'src/server/messages'
import { PromiseOf } from 'src/server/types'
import { parseAsModel } from 'src/server/utils'

type Callback = (message: IncomingMessage) => Promise<void>

/**
 * @see https://www.zigbee2mqtt.io/information/mqtt_topics_and_message_structure.html
 */
export type MqttClient = PromiseOf<ReturnType<typeof createMqttClient>>
export async function createMqttClient(
  mqttAddress: string,
  debug: DebugOutput,
) {
  const mqtt = await MQTT.connectAsync(mqttAddress)
  const callbacks: Callback[] = []

  // Add handler for incoming messages:
  ;(mqtt as any).on('message', async (topic: string, message: Buffer) => {
    debug.logIncomingMessage(topic, message)
    let parsed
    try {
      parsed = parseAsModel(IncomingMessage)({
        topic: topic.split('/'),
        body: JSON.parse(message.toString()),
      })
    } catch (err) {
      console.log('Could not parse incoming message: ' + err)
    }
    if (parsed) {
      for (const callback of callbacks) {
        await callback(parsed)
      }
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
      topicParts: string[],
      message: Record<string, unknown>,
    ) {
      const topic = topicParts.join('/')
      debug.logOutgoingMessage(topic, message)
      await mqtt.publish(topic, JSON.stringify(message))
    },
  }
}
