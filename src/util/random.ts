export type Random = () => number

export const shuffle = <T>(xs: readonly T[], random: Random = Math.random) =>
  xs
    .map((value) => ({ seed: random(), value }))
    .sort((a, b) => a.seed - b.seed)
    .map(({ value }) => value)
