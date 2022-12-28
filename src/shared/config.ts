import _ from 'lodash'

export const PORT = 3001

export default configuration({
  työhuone_group: {
    type: 'Light',
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
  },

  olkkari_group: {
    type: 'Light',
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
  },

  ruokapöytä_group: {
    type: 'Light',
    zones: [
      [
        [274, 27],
        [274, 335],
        [427, 336],
        [427, 27],
        [274, 27],
      ],
    ],
  },

  keittiö_group: {
    type: 'Light',
    zones: [
      [
        [382, 336],
        [382, 585],
        [274, 585],
        [274, 335],
        [382, 336],
      ],
    ],
  },

  tiskipöytä_group: {
    type: 'Light',
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
  },

  eteinen_group: {
    type: 'Light',
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
  },

  parveke_group: {
    type: 'PowerPlug',
    zones: [
      [
        [725, 348],
        [918, 314],
        [966, 560],
        [773, 594],
      ],
    ],
  },

  pikkuvessa_group: {
    type: 'Light',
    zones: [
      [
        [274, 685],
        [200, 685],
        [200, 845],
        [274, 845],
        [274, 685],
      ],
    ],
  },

  kylppäri_group: {
    type: 'Light',
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
  },

  siivouskaappi_1: {
    type: 'Light',
    zones: [
      [
        [616, 621.5],
        [610, 585],
        [510, 585],
        [510, 640],
      ],
    ],
    debugZones: false,
  },

  siivouskaappi_ovi: {
    type: 'DoorSensor',
    controls: ['siivouskaappi_1'],
  },
})

function configuration<
  C extends {
    [K in keyof C]:
      | {
          type: 'Light' | 'PowerPlug'
          zones: [number, number][][]
          debugZones?: boolean
        }
      | {
          type: 'DoorSensor'
          controls?: (keyof C)[]
        }
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
