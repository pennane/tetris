export type Matrix<T> = ReadonlyArray<ReadonlyArray<T>>

export const cellAt = <T>(
  m: Matrix<T>,
  row: number,
  col: number
): T | undefined => m[row]?.[col]

const requireCell = <T>(m: Matrix<T>, row: number, col: number): T => {
  const cell = cellAt(m, row, col)
  if (cell === undefined) throw new RangeError(`No cell at ${row},${col}`)
  return cell
}

export const overlay = <A, B, C>(
  base: Matrix<A>,
  top: Matrix<B>,
  row: number,
  col: number,
  merge: (base: A, top: B) => C
): Matrix<A | C> =>
  base.map((r, y) =>
    r.map((cell, x) => {
      const over = cellAt(top, y - row, x - col)
      return over === undefined ? cell : merge(cell, over)
    })
  )

export const rotate90 = <T>(m: Matrix<T>): Matrix<T> => {
  const n = m.length - 1
  return m.map((row, i) => row.map((_, j) => requireCell(m, n - j, i)))
}
export const rotate180 = <T>(m: Matrix<T>) => rotate90(rotate90(m))
export const rotate270 = <T>(m: Matrix<T>) => rotate90(rotate180(m))
