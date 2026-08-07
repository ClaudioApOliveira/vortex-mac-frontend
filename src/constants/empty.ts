/** Shared empty array to avoid unstable `?? []` identities breaking memoization. */
const EMPTY_ARRAY: never[] = []

export function emptyArray<T>(): T[] {
  return EMPTY_ARRAY as T[]
}
