import _ from 'lodash'
import { Config, DeviceName } from 'src/shared/utils/config'
import { getDeviceConfig } from './config'

export type StateMap = {
  [K in DeviceName]?: Config[K]['type'] extends 'Light'
    ? {
        brightness: number
        updated: Date
      }
    : Config[K]['type'] extends 'PowerPlug'
    ? {
        powerOn: boolean
        updated: Date
      }
    : Config[K]['type'] extends 'DoorSensor'
    ? {
        doorOpen: boolean
        updated: Date
      }
    : Config[K]['type'] extends 'MotionSensor'
    ? {
        motionDetected: boolean
        updated: Date
      }
    : never
}

export function getDeviceState<T extends DeviceName>(
  state: StateMap,
  name: T,
): StateMap[T] {
  const ds = state[name]
  if (!ds) throw new Error(`Getting state for unknown device "${name}"`)
  return ds
}

export function setDeviceState<T extends DeviceName>(
  state: StateMap,
  name: T,
  newState: Partial<StateMap[T]>,
): StateMap {
  const device = getDeviceConfig(name)
  if (!device) throw new Error(`Setting state for unknown device "${name}"`)
  return {
    ...state,
    [name]: {
      ...state[name],
      ...newState,
      ..._.identity<Partial<StateMap[DeviceName]>>({
        updated: new Date(),
      }),
    },
  }
}
