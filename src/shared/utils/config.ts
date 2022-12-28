import config from 'src/shared/config'

export type Config = typeof config
export type DeviceName = keyof Config
export type Device = Config[DeviceName]

export function getDeviceName(
  input: string | { topic: ['zigbee2mqtt', string] },
): DeviceName | null {
  const candidate: string = typeof input === 'string' ? input : input.topic[1]
  return Object.keys(config).includes(candidate)
    ? (candidate as DeviceName)
    : null
}

export function getDeviceConfig(
  input: string | { topic: ['zigbee2mqtt', string] },
): Device | null {
  const name = getDeviceName(input)
  return name ? config[name] : null
}
