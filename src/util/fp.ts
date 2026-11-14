export type NonEmpty<T> = readonly [T, ...T[]]

export const isNonEmpty = <T>(xs: readonly T[]): xs is NonEmpty<T> =>
  xs.length > 0

export const asLongAs =
  <T>(pred: (val: T) => boolean, fn: (val: T) => T) =>
  (init: T): T => {
    let current = init
    while (true) {
      const next = fn(current)
      if (!pred(next)) return current
      current = next
    }
  }

export const mapToNewRange = (
  n: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
) => ((n - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin

export const clamp = (min: number, max: number, n: number) =>
  Math.min(max, Math.max(min, n))
