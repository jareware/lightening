import { normalize } from 'path';

export type Config = ReturnType<typeof readConfigFromEnv>;

export function readConfigFromEnv() {
  const config = {
    LIGHTENING_TRADFRI_HOSTNAME: process.env.LIGHTENING_TRADFRI_HOSTNAME || '',
    LIGHTENING_TRADFRI_IDENTITY: process.env.LIGHTENING_TRADFRI_IDENTITY || '',
    LIGHTENING_TRADFRI_PSK: process.env.LIGHTENING_TRADFRI_PSK || '',
    LIGHTENING_WEB_PORT: 8080,
    LIGHTENING_WEB_ROOT: normalize(__dirname + '/../../client/'),
    LIGHTENING_WEBSOCKET_PORT: 8081,
  };
  if (!config.LIGHTENING_TRADFRI_HOSTNAME || !config.LIGHTENING_TRADFRI_IDENTITY || !config.LIGHTENING_TRADFRI_PSK)
    throw new Error('Mandatory Trådfri configuration missing from environment');
  return config;
}
