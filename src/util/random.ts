export const randomInt = (min: number, max: number) => {
  min = Math.ceil(min)
  max = Math.floor(max)

  return Math.floor(Math.random() * (max - min + 1)) + min
}

export const shuffle = <T>(arr: T[]): T[] =>
  arr
    .map((value) => ({ seed: Math.random(), value: value }))
    .sort((a, b) => a.seed - b.seed)
    .map(({ value }) => value)
