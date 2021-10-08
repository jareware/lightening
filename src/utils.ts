import { isRight } from 'fp-ts/lib/Either'
import * as t from 'io-ts'
import { PathReporter } from 'io-ts/lib/PathReporter'

/**
 * @see https://github.com/gcanti/io-ts/blob/master/index.md#implemented-types--combinators
 */
export function parseAsModel<C extends t.Any>(
  codec: C,
): (x: unknown) => t.TypeOf<C> {
  return x => {
    const result = codec.decode(x)
    if (isRight(result)) {
      return result.right
    } else {
      throw Object.assign(
        new Error(`Could not parse given data as model ${codec.name}`),
        {
          modelName: codec.name,
          givenData: x,
          parseErrors: PathReporter.report(result),
        },
      )
    }
  }
}

/**
 * @see parseAsModel()
 */
export function isModel<C extends t.Any>(codec: C) {
  return (x: unknown): x is t.TypeOf<C> => {
    const result = codec.decode(x)
    return isRight(result)
  }
}

/**
 * Can be used to implement exhaustiveness checks in TS.
 */
export function assertExhausted(value: never): never {
  throw new Error(
    `Runtime behaviour doesn't match type definitions (value was "${value}")`,
  )
}
