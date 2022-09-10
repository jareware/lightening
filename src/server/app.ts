import { createCommandModule } from 'src/server/command'
import { createDebugOutput } from 'src/server/debug'
import { createMqttClient } from 'src/server/mqtt'
import { createStateMachine } from 'src/server/state'

export async function createApp(mqttAddress: string) {
  const debug = await createDebugOutput()
  const mqtt = await createMqttClient(mqttAddress, debug)
  const command = await createCommandModule(mqtt)
  const state = await createStateMachine(command, debug)

  mqtt.onIncomingMessage(state.processIncomingMessage)

  return { mqtt, command, state }
}
