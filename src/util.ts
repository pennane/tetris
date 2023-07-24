import { GenericMatrix } from './logic.model'
import * as R from 'ramda'

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

export const mergeMatrices = <A, B>(
  a: GenericMatrix<A>,
  b: GenericMatrix<B>,
  bX: number,
  bY: number,
  merge: (a: A, b: B) => A
) => {
  return a.map((row, rowIndex) =>
    row.map((cell, columnIndex) => {
      if (columnIndex >= bX && columnIndex < bX + b.length) {
        if (rowIndex >= bY && rowIndex < bY + b[0].length) {
          return merge(cell, R.path([rowIndex - bY, columnIndex - bX], b))
        }
      }
      return cell
    })
  )
}

export const rotate90 = <T>(m: GenericMatrix<T>): GenericMatrix<T> => {
  const N = m.length - 1
  return m.map((row, i) => row.map((_, j) => m[N - j][i]))
}
export const rotate180 = R.pipe(rotate90, rotate90)
export const rotate270 = R.pipe(rotate90, rotate90, rotate90)

export const mapToNewRange = (
  number: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
) => {
  return ((number - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin
}
