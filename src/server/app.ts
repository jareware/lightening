import { createCommandModule } from 'src/server/command'
import { createDebugOutput } from 'src/server/debug'
import { createMqttClient } from 'src/server/mqtt'
import { createStateMachine } from 'src/server/state'
import { createWebServer } from 'src/server/web'

export async function createApp(mqttAddress: string) {
  const output = await createDebugOutput()
  const mqtt = await createMqttClient(mqttAddress, output)
  const command = await createCommandModule(mqtt)
  const web = await createWebServer(command)
  const state = await createStateMachine(command, output, web)

  mqtt.onIncomingMessage(state.processIncomingMessage)

  return { mqtt, command, state }
}
