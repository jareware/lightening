/**
 * Unwrap something PromiseLike.
 */
export type PromiseOf<T> = T extends PromiseLike<infer U> ? U : T
