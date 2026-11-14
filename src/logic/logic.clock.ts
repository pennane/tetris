import { MAX_TICKS_PER_FRAME, TICK_MS } from './logic.constants'
import type { Timestamp } from './logic.model'

export const ticksDue = (last: Timestamp, now: Timestamp) => {
  const due = Math.max(0, Math.floor((now - last) / TICK_MS))
  return due > MAX_TICKS_PER_FRAME
    ? { ticks: MAX_TICKS_PER_FRAME, last: now }
    : { ticks: due, last: last + due * TICK_MS }
}
