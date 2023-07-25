export const asLongAs =
  <T>(pred: (val: T) => boolean, fn: (val: T) => T) =>
  (init: T) => {
    let lastSuccessfull = init
    let lastTest = init
    while (true) {
      lastTest = fn(lastSuccessfull)
      if (!pred(lastTest)) return lastSuccessfull
      lastSuccessfull = lastTest
    }
  }

export const mapToNewRange = (
  number: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
) => {
  return ((number - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin
}
