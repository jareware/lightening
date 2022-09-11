import { MqttClient } from 'src/server/mqtt'
import { LightGroups } from 'src/server/state'
import { PromiseOf } from 'src/server/types'

export type CommandModule = PromiseOf<ReturnType<typeof createCommandModule>>
export async function createCommandModule(mqtt: MqttClient) {
  return {
    queryCurrentState,
    setNewLightState,
    setNewLightStateIfNeeded,
  }

  function nameOf(device: string | { friendlyName: string }) {
    return typeof device === 'string' ? device : device?.friendlyName
  }

  async function queryCurrentState(device: string | { friendlyName: string }) {
    await mqtt.publishOutgoingMessage(['zigbee2mqtt', nameOf(device), 'get'], {
      state: '',
    })
  }

  async function setNewLightState(
    device: string | { friendlyName: string },
    brightness: number,
    transition = 2,
  ) {
    await mqtt.publishOutgoingMessage(['zigbee2mqtt', nameOf(device), 'set'], {
      brightness,
      state: brightness === 0 ? 'OFF' : 'ON',
      transition,
    })
  }

  async function setNewLightStateIfNeeded(
    device: string | { friendlyName: string },
    brightness: number,
    currentStates: LightGroups,
  ) {
    const isAlreadyInDesiredState = createDesiredStateMatcher(brightness)
    if (
      currentStates
        .find(group => group.friendlyName === nameOf(device))
        ?.members.every(isAlreadyInDesiredState)
    ) {
      console.log(`No need to set ${nameOf(device)}`)
      return // this group is already set!
    } else {
      console.log(`WILL set ${nameOf(device)}`)
      await setNewLightState(nameOf(device), brightness)
    }
  }
}

export function createDesiredStateMatcher(brightness: number) {
  return (light: LightGroups[number]['members'][number]) =>
    (brightness === 0 && light.latestReceivedState?.state === 'OFF') ||
    (brightness !== 0 &&
      light.latestReceivedState?.state === 'ON' &&
      light.latestReceivedState.brightness === brightness)
}