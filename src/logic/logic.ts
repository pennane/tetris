import * as R from 'ramda'
import { chain, emit, map, of } from '../util/events'
import { at } from './logic.lens'
import {
  addScore,
  clearFullRows,
  createInitialState,
  instantDrop,
  isFailState,
  isValidState,
  levelOf,
  lineClearScore,
  mergePiece,
  moveDown,
  moveLeft,
  moveRight,
  rotate,
  shouldPlaceDown,
  spawnNext,
  speedOf
} from './logic.lib'
import { Action } from './logic.model'
import type {
  GameEvent,
  Msg,
  Outcome,
  State,
  StateTransformation
} from './logic.model'

export const TICK: Msg = Object.freeze({ type: 'tick' })
export const input = (action: Action): Msg => ({ type: 'input', action })

const quiet = of<State, GameEvent>

const attempt = (move: StateTransformation) =>
  R.when(R.pipe(move, isValidState), move)

const MOVES: Readonly<Record<Action, StateTransformation>> = {
  [Action.ROTATE]: attempt(rotate),
  [Action.LEFT]: attempt(moveLeft),
  [Action.RIGHT]: attempt(moveRight),
  [Action.DOWN]: attempt(moveDown),
  [Action.JUMP]: attempt(instantDrop)
}

const clearLines = (state: State): Outcome => {
  const levelBefore = levelOf(state)
  const { board, cleared } = clearFullRows(
    mergePiece(at.board.view(state), at.piece.view(state))
  )
  const next = R.pipe(
    at.board.set(board),
    addScore(lineClearScore(cleared, levelBefore)),
    at.linesCleared.over(R.add(cleared))
  )(state)
  const levelAfter = levelOf(next)
  const events: GameEvent[] = []
  if (cleared > 0) events.push({ type: 'linesCleared', count: cleared })
  if (levelAfter > levelBefore) events.push({ type: 'levelUp', level: levelAfter })
  return { value: next, events }
}

const gameOver = (state: State): Outcome => ({
  value: createInitialState(at.seed.view(state)),
  events: [{ type: 'gameOver', finalScore: at.score.view(state) }]
})

const restartIfToppedOut = R.ifElse(isFailState, gameOver, quiet)

const lockPiece = R.pipe(
  quiet,
  emit<GameEvent>({ type: 'pieceLocked' }),
  chain(clearLines),
  map(spawnNext),
  chain(restartIfToppedOut)
)

const isFallDue = R.pipe(at.nextFall.view, R.equals(0))
const resetFallTimer = (state: State) => at.nextFall.set(speedOf(state))(state)
const countDown = R.ifElse(isFallDue, resetFallTimer, at.nextFall.over(R.dec))

const fall = R.ifElse(
  isFallDue,
  R.ifElse(shouldPlaceDown, lockPiece, R.pipe(moveDown, quiet)),
  quiet
)

const gravity = R.pipe(countDown, fall)

export const update = (msg: Msg) =>
  msg.type === 'tick' ? gravity : R.pipe(MOVES[msg.action], quiet)

const applyMsg = (outcome: Outcome, msg: Msg) => chain(update(msg))(outcome)

export const run = (state: State, msgs: readonly Msg[]) =>
  R.reduce(applyMsg, quiet(state), msgs)
