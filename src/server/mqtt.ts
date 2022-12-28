import MQTT from 'async-mqtt'
import { DebugOutput } from 'src/server/debug'
import { PromiseOf } from 'src/server/types'
import { parseAsModel } from 'src/server/utils'
import { IncomingMessage } from 'src/shared/types/messages'

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
    try {
      if (shouldIgnoreTopic(topic)) {
        console.log(`  Ignored Zigbee message ⚫️ ${topic}`)
        return
      }
      const parsed = parseAsModel(IncomingMessage)({
        topic: topic.split('/'),
        body: JSON.parse(message.toString()),
      })
      for (const callback of callbacks) {
        await callback(parsed)
      }
      console.log(`Processed Zigbee message 🟢 ${topic}`)
    } catch (err) {
      console.log(`Processed Zigbee message 🔴 ${topic} (${err})`)
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

function shouldIgnoreTopic(topic: string) {
  const [_namespace, friendlyName, detail] = topic.split('/')
  return (
    (friendlyName === 'bridge' && !['devices', 'groups'].includes(detail)) ||
    (friendlyName !== 'bridge' && detail)
  )
}
