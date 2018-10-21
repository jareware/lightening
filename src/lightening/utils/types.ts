// Can be used to implement exhaustiveness checks in TS.
// Returns "any" for convenience.
export function assertExhausted(value: void): any {
  throw new Error(`Runtime behaviour doesn't match type definitions (value was "${value}")`);
}

// Helper for excluding null & undefined.
// @example const arr: Array<string | null> = [];
//          const strings: Array<string> = arr.filter(isNotNull);
export function isNotNull<T extends any>(x: T): x is NonNullable<T> {
  return x !== null && typeof x !== 'undefined';
}
