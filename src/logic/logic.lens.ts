import { compose, prop } from '../util/accessor'
import type { Lock, Piece, State } from './logic.model'

const state = prop<State>()
const piece = prop<Piece>()
const lock = prop<Lock>()

export const at = {
  board: state('board'),
  piece: state('piece'),
  sequence: state('sequence'),
  nextFall: state('nextFall'),
  lock: state('lock'),
  score: state('score'),
  linesCleared: state('linesCleared'),
  seed: state('seed'),
  pieceType: compose(state('piece'), piece('type')),
  pieceCol: compose(state('piece'), piece('col')),
  pieceRow: compose(state('piece'), piece('row')),
  pieceRotation: compose(state('piece'), piece('rotation')),
  lockTimer: compose(state('lock'), lock('timer')),
  lockResets: compose(state('lock'), lock('resets')),
  lowestRow: compose(state('lock'), lock('lowestRow'))
} as const
