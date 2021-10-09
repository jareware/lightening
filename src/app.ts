import { createMqttClient } from 'src/mqtt'
import { createStateMachine } from 'src/state'

export async function createApp(mqttAddress: string) {
  const mqtt = await createMqttClient(mqttAddress)
  const state = await createStateMachine(mqtt)

  mqtt.onIncomingMessage(state.processIncomingMessage)

  return { mqtt, state }
}
