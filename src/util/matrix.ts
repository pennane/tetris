import { GenericMatrix } from '../logic/logic.model'
import * as R from 'ramda'

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
