import { createCommandModule } from 'src/command'
import { createDebugOutput } from 'src/debug'
import { createMqttClient } from 'src/mqtt'
import { createStateMachine } from 'src/state'

export async function createApp(mqttAddress: string) {
  const debug = await createDebugOutput()
  const mqtt = await createMqttClient(mqttAddress, debug)
  const command = await createCommandModule(mqtt)
  const state = await createStateMachine(command, debug)

  mqtt.onIncomingMessage(state.processIncomingMessage)

  return { mqtt, command, state }
}
