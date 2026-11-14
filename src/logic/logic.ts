import * as R from 'ramda'
import { chain, emit, map, of } from '../util/events'
import { LOCK_DELAY_TICKS, MAX_LOCK_RESETS } from './logic.constants'
import { at } from './logic.lens'
import {
  addScore,
  clearFullRows,
  createInitialState,
  instantDrop,
  isFailState,
  isGrounded,
  isValidState,
  levelOf,
  lineClearScore,
  markLowest,
  mergePiece,
  moveDown,
  moveLeft,
  moveRight,
  rotate,
  spawnNext,
  speedOf
} from './logic.lib'
import { Action } from './logic.model'
import type {
  GameEvent,
  GameStep,
  Msg,
  Outcome,
  State,
  StateTransformation
} from './logic.model'

export const TICK: Msg = Object.freeze({ type: 'tick' })
export const input = (action: Action): Msg => ({ type: 'input', action })

const quiet = of<State, GameEvent>

const restartLockDelay = at.lockTimer.set(LOCK_DELAY_TICKS)
const hasResetsLeft = R.pipe(at.lockResets.view, R.gt(MAX_LOCK_RESETS))
const canResetLock = R.both(isGrounded, hasResetsLeft)
const resetLock = R.pipe(restartLockDelay, at.lockResets.over(R.inc))

const attempt = (move: StateTransformation, ...events: GameEvent[]) =>
  R.ifElse(
    R.pipe(move, isValidState),
    R.pipe(move, quiet, emit(...events)),
    quiet
  )

const adjust = (move: StateTransformation, ...events: GameEvent[]) =>
  attempt(R.pipe(R.when(canResetLock, resetLock), move), ...events)

const MOVES: Readonly<Record<Action, GameStep>> = {
  [Action.ROTATE]: adjust(rotate, { type: 'rotated' }),
  [Action.LEFT]: adjust(moveLeft, { type: 'moved' }),
  [Action.RIGHT]: adjust(moveRight, { type: 'moved' }),
  [Action.DOWN]: attempt(moveDown),
  [Action.JUMP]: attempt(instantDrop, { type: 'hardDropped' })
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

const isLockDue = R.pipe(at.lockTimer.view, R.gte(0))

const settle = R.ifElse(
  isGrounded,
  R.pipe(at.lockTimer.over(R.dec), R.ifElse(isLockDue, lockPiece, quiet)),
  R.pipe(restartLockDelay, quiet)
)

const fall = R.when(R.both(isFallDue, R.complement(isGrounded)), moveDown)

const gravity = R.pipe(countDown, settle, map(fall))

const isBelowLowest = (state: State) =>
  at.pieceRow.view(state) > at.lowestRow.view(state)

const reachLowest = R.pipe(markLowest, at.lockResets.set(0), restartLockDelay)

const trackLowest = R.when(isBelowLowest, reachLowest)

const respond = (msg: Msg) =>
  msg.type === 'tick' ? gravity : MOVES[msg.action]

export const update = (msg: Msg) => R.pipe(respond(msg), map(trackLowest))

const applyMsg = (outcome: Outcome, msg: Msg) => chain(update(msg))(outcome)

export const run = (state: State, msgs: readonly Msg[]) =>
  R.reduce(applyMsg, quiet(state), msgs)
