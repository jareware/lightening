import _ from 'lodash'
import { IconName } from 'src/client/Icon'

export const PORT = 3001

function Light(options: {
  zones?: [number, number][][]
  location?: [number, number]
  icon?: IconName
  turnOffAfterMinutes?: number
  debug?: boolean
}) {
  return {
    ...options,
    type: 'Light' as const,
  }
}

function PowerPlug(options: {
  zones?: [number, number][][]
  location?: [number, number]
  icon?: IconName
  debug?: boolean
}) {
  return {
    ...options,
    type: 'PowerPlug' as const,
  }
}

function DoorSensor(options: {
  controls?: string[]
  controlsBrightness?: number
  location?: [number, number]
  icon?: IconName
  debug?: boolean
}) {
  return {
    ...options,
    type: 'DoorSensor' as const,
  }
}

function MotionSensor(options: {
  controls?: string[]
  controlsBrightness?: number
  location?: [number, number]
  icon?: IconName
  debug?: boolean
}) {
  return {
    ...options,
    type: 'MotionSensor' as const,
  }
}

export type Device =
  | ReturnType<typeof Light>
  | ReturnType<typeof PowerPlug>
  | ReturnType<typeof DoorSensor>
  | ReturnType<typeof MotionSensor>

export default configuration({
  työhuone_group: Light({
    zones: [
      [
        [427, 365],
        [722, 333],
        [773, 594],
        [616, 621.5],
        [610, 585],
        [427, 585],
        [427, 365],
      ],
    ],
  }),

  olkkari_group: Light({
    zones: [
      [
        [722, 333],
        [662, 27],
        [427, 27],
        [427, 336],
        [427, 365],
        [722, 333],
      ],
    ],
  }),

  ruokapöytä_group: Light({
    zones: [
      [
        [274, 27],
        [274, 335],
        [427, 336],
        [427, 27],
        [274, 27],
      ],
    ],
  }),

  keittiö_group: Light({
    zones: [
      [
        [382, 336],
        [382, 585],
        [274, 585],
        [274, 335],
        [382, 336],
      ],
    ],
  }),

  tiskipöytä_group: Light({
    zones: [
      // Pitkä työtaso:
      [
        [281, 335],
        [230, 335],
        [230, 585],
        [281, 585],
        [281, 335],
      ],
      // Lyhyt työtaso:
      [
        [376, 336],
        [427, 336],
        [427, 585],
        [376, 585],
        [376, 336],
      ],
    ],
  }),

  eteinen_group: Light({
    zones: [
      [
        [274, 585],
        [510, 585],
        [510, 733],
        [460, 733],
        [460, 845],
        [274, 845],
        [274, 585],
      ],
    ],
  }),

  parveke_group: PowerPlug({
    zones: [
      [
        [725, 348],
        [918, 314],
        [966, 560],
        [773, 594],
      ],
    ],
  }),

  pikkuvessa_group: Light({
    zones: [
      [
        [274, 685],
        [200, 685],
        [200, 845],
        [274, 845],
        [274, 685],
      ],
    ],
  }),

  kylppäri_group: Light({
    zones: [
      [
        [32, 482],
        [230, 482],
        [230, 585],
        [274, 585],
        [274, 685],
        [200, 685],
        [200, 720],
        [32, 720],
        [32, 482],
      ],
    ],
  }),

  siivouskaappi_1: Light({
    zones: [
      [
        [616, 621.5],
        [610, 585],
        [510, 585],
        [510, 640],
      ],
    ],
  }),

  kylppäri_yövalo: Light({
    location: [85, 535],
    icon: 'Fluorescent',
    turnOffAfterMinutes: 5,
  }),

  siivouskaappi_ovi: DoorSensor({
    controls: ['siivouskaappi_1'],
  }),

  vaatehuone_liike: MotionSensor({
    controls: ['kylppäri_yövalo'],
    controlsBrightness: 2, // note that 1 is too low to turn on an IKEA LED driver
    location: [178, 387],
    icon: 'Sensors',
  }),

  eteinen_liike: MotionSensor({
    location: [411, 637],
    icon: 'Sensors',
  }),

  emman_pulputin: PowerPlug({
    location: [660, 669],
    icon: 'Water Voc',
  }),

  emman_ovi: DoorSensor({
    location: [562,685],
    icon: 'Door Sensor',
  }),
})

function configuration<
  C extends {
    [K in keyof C]: Device // TODO: controls?: (keyof C)[]
  },
>(
  config: C,
): {
  [K in keyof C]: C[K] & {
    name: K
  }
} {
  return _.mapValues(config, (x, name) => ({ ...x, name })) as any
}
