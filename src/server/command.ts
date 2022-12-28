import { MqttClient } from 'src/server/mqtt'
import { PromiseOf } from 'src/server/types'
import { Device } from 'src/shared/utils/config'

export type CommandModule = PromiseOf<ReturnType<typeof createCommandModule>>
export async function createCommandModule(mqtt: MqttClient) {
  return {
    setLightState,
    setPowerState,
    setOptions,
  }

  async function setLightState(
    device: Extract<Device, { type: 'Light' }>,
    brightness: number,
    transition = 0.75, // matches the transition time the wall switches use
  ) {
    await mqtt.publishOutgoingMessage(['zigbee2mqtt', device.name, 'set'], {
      brightness,
      state: brightness === 0 ? 'OFF' : 'ON',
      transition,
    })
  }

  async function setPowerState(
    device: Extract<Device, { type: 'PowerPlug' }>,
    powerOn: boolean,
  ) {
    await mqtt.publishOutgoingMessage(['zigbee2mqtt', device.name, 'set'], {
      state: powerOn ? 'ON' : 'OFF',
    })
  }

  async function setOptions(
    type: 'group' | 'device',
    friendlyName: string,
    options: { retain?: boolean },
  ) {
    await mqtt.publishOutgoingMessage(
      ['zigbee2mqtt', 'bridge', 'request', type, 'options'],
      {
        id: friendlyName,
        options,
      },
    )
  }
}
