import * as R from 'ramda'

export type Seed = number

const GOLDEN_GAMMA = 0x6d2b79f5
const UINT32_RANGE = 2 ** 32

export const freshSeed = (): Seed => Math.floor(Math.random() * UINT32_RANGE)

export const nextRandom = (seed: Seed): readonly [number, Seed] => {
  const next = (seed + GOLDEN_GAMMA) | 0
  let t = Math.imul(next ^ (next >>> 15), 1 | next)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return [((t ^ (t >>> 14)) >>> 0) / UINT32_RANGE, next >>> 0]
}

export type Seeded<T> = Readonly<{ value: T; seed: Seed }>

export const shuffle = <T>(xs: readonly T[], seed: Seed): Seeded<T[]> => {
  const [nextSeed, keyed] = R.mapAccum(
    (s: Seed, value: T): [Seed, { key: number; value: T }] => {
      const [key, next] = nextRandom(s)
      return [next, { key, value }]
    },
    seed,
    [...xs]
  )
  return {
    value: [...keyed].sort((a, b) => a.key - b.key).map(({ value }) => value),
    seed: nextSeed
  }
}
