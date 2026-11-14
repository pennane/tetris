import { compose, prop } from '../util/accessor'
import type { Piece, State } from './logic.model'

const state = prop<State>()
const piece = prop<Piece>()

export const at = {
  board: state('board'),
  piece: state('piece'),
  sequence: state('sequence'),
  nextFall: state('nextFall'),
  score: state('score'),
  linesCleared: state('linesCleared'),
  seed: state('seed'),
  pieceType: compose(state('piece'), piece('type')),
  pieceCol: compose(state('piece'), piece('col')),
  pieceRow: compose(state('piece'), piece('row')),
  pieceRotation: compose(state('piece'), piece('rotation'))
} as const
