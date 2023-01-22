import _ from 'lodash'
import { Config, DeviceName } from 'src/shared/utils/config'
import { getDeviceConfig } from './config'

export type StateMap = {
  [K in DeviceName]?: Config[K]['type'] extends 'Light'
    ? {
        brightness: number
        updated: string // in ISO format
        lastSetOnAt?: string // in ISO format
      }
    : Config[K]['type'] extends 'PowerPlug'
    ? {
        powerOn: boolean
        updated: string // in ISO format
      }
    : Config[K]['type'] extends 'DoorSensor'
    ? {
        doorOpen: boolean
        updated: string // in ISO format
      }
    : Config[K]['type'] extends 'MotionSensor'
    ? {
        motionDetected: boolean
        updated: string // in ISO format
      }
    : never
}

export function getDeviceState<T extends DeviceName>(
  state: StateMap,
  name: T,
): StateMap[T] | undefined {
  const device = getDeviceConfig(name)
  if (!device) throw new Error(`Setting state for unknown device "${name}"`)
  return state[name]
}

export function setDeviceState<T extends DeviceName>(
  state: StateMap,
  name: T,
  newState: Omit<NonNullable<StateMap[T]>, 'updated'>,
): StateMap {
  const device = getDeviceConfig(name)
  if (!device) throw new Error(`Setting state for unknown device "${name}"`)
  return {
    ...state,
    [name]: {
      ...state[name],
      ...newState,
      ..._.identity<Partial<StateMap[DeviceName]>>({
        updated: new Date().toISOString(),
      }),
    },
  }
}
