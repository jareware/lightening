export type Config = ReturnType<typeof readConfigFromEnv>;

export function readConfigFromEnv() {
  return {
    LIGHTENING_TRADFRI_HOSTNAME: process.env.LIGHTENING_TRADFRI_HOSTNAME || '',
    LIGHTENING_TRADFRI_IDENTITY: process.env.LIGHTENING_TRADFRI_IDENTITY || '',
    LIGHTENING_TRADFRI_PSK: process.env.LIGHTENING_TRADFRI_PSK || '',
  };
}
