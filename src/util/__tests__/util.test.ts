import { describe, expect, it } from 'vitest'
import { compose, prop } from '../accessor'
import { overlay, rotate90, rotate270 } from '../matrix'
import { asLongAs } from '../fp'
import { nextRandom, shuffle } from '../random'
import { foldK, pipeK, pure, tell, type Step } from '../writer'

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

describe('writer', () => {
  const inc: Step<number, string> = (n) => ({ state: n + 1, events: [`inc ${n}`] })
  const dbl: Step<number, string> = (n) => ({ state: n * 2, events: [] })

  it('has pure as identity on both sides', () => {
    expect(pipeK(pure, inc)(1)).toEqual(inc(1))
    expect(pipeK(inc, pure)(1)).toEqual(inc(1))
  })

  it('is associative and accumulates events in order', () => {
    const left = pipeK(pipeK(inc, dbl), tell<number, string>('done'))
    const right = pipeK(inc, pipeK(dbl, tell<number, string>('done')))
    expect(left(3)).toEqual(right(3))
    expect(left(3)).toEqual({ state: 8, events: ['inc 3', 'done'] })
  })

  it('folds a message log through a step function', () => {
    const add = (n: number, m: number) => ({ state: n + m, events: [m] })
    expect(foldK(add)(0, [1, 2, 3])).toEqual({ state: 6, events: [1, 2, 3] })
  })
})

describe('random', () => {
  it('is a pure function of the seed', () => {
    expect(nextRandom(9)).toEqual(nextRandom(9))
    const [x] = nextRandom(9)
    expect(x).toBeGreaterThanOrEqual(0)
    expect(x).toBeLessThan(1)
  })

  it('shuffles to a permutation and threads the seed', () => {
    const { value, seed } = shuffle([1, 2, 3, 4, 5], 9)
    expect([...value].sort()).toEqual([1, 2, 3, 4, 5])
    expect(seed).not.toBe(9)
  })
})
