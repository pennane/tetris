import type { GameEvent, Level } from '../logic/logic.model'

type Toast = string | null

type ToastTable = {
  [K in GameEvent['type']]: K extends 'levelUp'
    ? (level: Level) => Toast
    : K extends 'linesCleared'
      ? (count: number) => Toast
      : Toast
}

const LINE_CLEAR_TOASTS: Readonly<Record<number, string>> = {
  3: 'triple',
  4: 'tetris!'
}

const TOASTS: ToastTable = {
  moved: null,
  rotated: null,
  hardDropped: null,
  pieceLocked: null,
  linesCleared: (count) => LINE_CLEAR_TOASTS[count] ?? null,
  levelUp: (level) => `level ${level}`,
  gameOver: 'game over'
}

export const toastFor = (event: GameEvent): Toast => {
  switch (event.type) {
    case 'levelUp':
      return TOASTS.levelUp(event.level)
    case 'linesCleared':
      return TOASTS.linesCleared(event.count)
    default:
      return TOASTS[event.type]
  }
}
