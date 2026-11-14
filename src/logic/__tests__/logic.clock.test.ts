import { describe, expect, it } from 'vitest'
import { ticksDue } from '../logic.clock'
import { MAX_TICKS_PER_FRAME, TICK_MS } from '../logic.constants'

describe('ticksDue', () => {
  it('emits no tick before a full interval has elapsed', () => {
    expect(ticksDue(0, TICK_MS - 1)).toEqual({ ticks: 0, last: 0 })
  })

  it('carries the remainder so tick rate is independent of frame rate', () => {
    const frame144 = 1000 / 144
    let last = 0
    let ticks = 0
    for (let now = frame144; now <= 1000; now += frame144) {
      const clock = ticksDue(last, now)
      ticks += clock.ticks
      last = clock.last
    }
    expect(ticks).toBeGreaterThanOrEqual(59)
    expect(ticks).toBeLessThanOrEqual(60)
  })

  it('drops the backlog after a long pause', () => {
    expect(ticksDue(0, 10_000)).toEqual({ ticks: MAX_TICKS_PER_FRAME, last: 10_000 })
  })

  it('ignores time going backwards', () => {
    expect(ticksDue(100, 50)).toEqual({ ticks: 0, last: 100 })
  })
})
