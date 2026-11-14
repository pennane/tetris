import * as R from 'ramda'
import { chain, emit, map, of } from '../util/events'
import { at } from './logic.lens'
import {
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
  GameStep,
  Msg,
  Outcome,
  State,
  StateTransformation
} from './logic.model'

export const TICK: Msg = Object.freeze({ type: 'tick' })
export const input = (action: Action): Msg => ({ type: 'input', action })

const ACTION_TO_TRANSFORMATION: Readonly<Record<Action, StateTransformation>> =
  {
    [Action.ROTATE]: rotate,
    [Action.LEFT]: moveLeft,
    [Action.RIGHT]: moveRight,
    [Action.DOWN]: moveDown,
    [Action.JUMP]: instantDrop
  }

const handleInput =
  (action: Action): StateTransformation =>
  (state) => {
    const moved = ACTION_TO_TRANSFORMATION[action](state)
    return isValidState(moved) ? moved : state
  }

const clearLines: GameStep = (state) => {
  const levelBefore = levelOf(state)
  const { board, cleared } = clearFullRows(
    mergePiece(at.board.view(state), at.piece.view(state))
  )
  const next = R.pipe(
    at.board.set(board),
    at.score.over(R.add(lineClearScore(cleared, levelBefore))),
    at.linesCleared.over(R.add(cleared))
  )(state)
  const levelAfter = levelOf(next)
  const events: GameEvent[] = []
  if (cleared > 0) events.push({ type: 'linesCleared', count: cleared })
  if (levelAfter > levelBefore) events.push({ type: 'levelUp', level: levelAfter })
  return { state: next, events }
}

const restartIfToppedOut: GameStep = (state) =>
  isFailState(state)
    ? {
        state: createInitialState(at.seed.view(state)),
        events: [{ type: 'gameOver', finalScore: at.score.view(state) }]
      }
    : of(state)

const lockPiece: GameStep = R.pipe(
  of<State, GameEvent>,
  emit<GameEvent>({ type: 'pieceLocked' }),
  chain(clearLines),
  map(spawnNext),
  chain(restartIfToppedOut)
)

const countDown: StateTransformation = (state) =>
  at.nextFall.over((n) => (n > 0 ? n - 1 : speedOf(state)))(state)

const fall: GameStep = (state) => {
  if (at.nextFall.view(state) !== 0) return of(state)
  return shouldPlaceDown(state) ? lockPiece(state) : of(moveDown(state))
}

const gravity: GameStep = R.pipe(countDown, fall)

export const update = (state: State, msg: Msg): Outcome =>
  msg.type === 'tick' ? gravity(state) : of(handleInput(msg.action)(state))

export const run = (state: State, msgs: readonly Msg[]): Outcome =>
  msgs.reduce(
    (outcome, msg) => chain((s: State) => update(s, msg))(outcome),
    of<State, GameEvent>(state)
  )
