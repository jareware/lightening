import { createCommandModule } from 'src/command'
import { createMqttClient } from 'src/mqtt'
import { createStateMachine } from 'src/state'

export async function createApp(mqttAddress: string) {
  const mqtt = await createMqttClient(mqttAddress)
  const command = await createCommandModule(mqtt)
  const state = await createStateMachine(command)

  mqtt.onIncomingMessage(state.processIncomingMessage)

  return { mqtt, command, state }
}
