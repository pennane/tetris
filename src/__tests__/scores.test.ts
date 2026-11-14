import { describe, expect, it } from 'vitest'
import { passesBest } from '../scores'

describe('passing the best score', () => {
  it.each([
    [90, 120, true],
    [100, 120, true],
    [120, 150, false],
    [50, 90, false],
    [90, 100, false]
  ] as const)('from %i to %i against a best of 100 is %s', (before, after, passed) => {
    expect(passesBest([100, 50])(before, after)).toBe(passed)
  })

  it('never fires without a stored best', () => {
    expect(passesBest([])(0, 10)).toBe(false)
  })
})
