import { MqttClient } from 'src/mqtt'
import { PromiseOf } from 'src/types'

export type CommandModule = PromiseOf<ReturnType<typeof createCommandModule>>
export async function createCommandModule(mqtt: MqttClient) {
  return {
    async queryCurrentState(device: string | { friendlyName: string }) {
      await mqtt.publishOutgoingMessage(
        [
          'zigbee2mqtt',
          typeof device === 'string' ? device : device?.friendlyName,
          'get',
        ],
        { state: '' },
      )
    },

    async setNewLightState(
      device: string | { friendlyName: string },
      brightness: number,
    ) {
      await mqtt.publishOutgoingMessage(
        [
          'zigbee2mqtt',
          typeof device === 'string' ? device : device.friendlyName,
          'set',
        ],
        { brightness, state: brightness === 0 ? 'OFF' : 'ON' },
      )
    },
  }
}
