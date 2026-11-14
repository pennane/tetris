import * as R from 'ramda'

export type Seed = number

const GOLDEN_GAMMA = 0x6d2b79f5
const UINT32_RANGE = 2 ** 32

export const freshSeed = () => Math.floor(Math.random() * UINT32_RANGE)

export const nextRandom = (seed: Seed): readonly [number, Seed] => {
  const next = (seed + GOLDEN_GAMMA) | 0
  let t = Math.imul(next ^ (next >>> 15), 1 | next)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return [((t ^ (t >>> 14)) >>> 0) / UINT32_RANGE, next >>> 0]
}

export type WithSeed<T> = Readonly<{ value: T; seed: Seed }>

type Keyed<T> = Readonly<{ key: number; value: T }>

const withRandomKey = <T>(seed: Seed, value: T): [Seed, Keyed<T>] => {
  const [key, next] = nextRandom(seed)
  return [next, { key, value }]
}

export const shuffle = <T>(xs: readonly T[], seed: Seed): WithSeed<T[]> => {
  const [next, keyed] = R.mapAccum(withRandomKey<T>, seed, xs)
  return {
    value: R.pipe(R.sortBy<Keyed<T>>(R.prop('key')), R.map(R.prop('value')))(keyed),
    seed: next
  }
}
