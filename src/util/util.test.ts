import { describe, expect, it } from 'vitest'
import { compose, prop } from './accessor'
import { overlay, rotate90, rotate270 } from './matrix'
import { asLongAs } from './fp'

type Inner = { n: number; tag: string }
type Outer = { inner: Inner; other: number }

describe('accessor', () => {
  const outer = prop<Outer>()
  const inner = prop<Inner>()
  const n = compose(outer('inner'), inner('n'))
  const s: Outer = { inner: { n: 1, tag: 'a' }, other: 9 }

  it('views, sets and overs through a composition without mutating', () => {
    expect(n.view(s)).toBe(1)
    expect(n.set(5)(s)).toEqual({ inner: { n: 5, tag: 'a' }, other: 9 })
    expect(n.over((x) => x + 1)(s).inner.n).toBe(2)
    expect(s.inner.n).toBe(1)
  })
})

describe('matrix', () => {
  it('rotates clockwise and back', () => {
    const m = [
      [1, 2],
      [3, 4]
    ]
    expect(rotate90(m)).toEqual([
      [3, 1],
      [4, 2]
    ])
    expect(rotate270(rotate90(m))).toEqual(m)
  })

  it('throws on non-square input', () => {
    expect(() => rotate90([[1, 2, 3]])).toThrow(RangeError)
  })

  it('overlays a non-square matrix at an offset, clipping at edges', () => {
    const base = [
      ['.', '.', '.'],
      ['.', '.', '.']
    ]
    const top = [[1, 1, 1]]
    expect(overlay(base, top, 1, 1, (b, t) => (t ? 'x' : b))).toEqual([
      ['.', '.', '.'],
      ['.', 'x', 'x']
    ])
  })
})

describe('asLongAs', () => {
  it('returns the last value passing the predicate', () => {
    expect(asLongAs((x: number) => x < 5, (x) => x + 2)(0)).toBe(4)
  })
})
