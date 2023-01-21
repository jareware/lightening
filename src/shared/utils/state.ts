import { Config, DeviceName } from 'src/shared/utils/config'

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
