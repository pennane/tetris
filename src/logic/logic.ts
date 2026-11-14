import * as R from 'ramda'
import { EXECUTE_INTERVAL_MS } from './logic.constants'
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
  Outcome,
  State,
  StateTransformation,
  Timestamp
} from './logic.model'

const ACTION_TO_TRANSFORMATION: Readonly<Record<Action, StateTransformation>> =
  {
    [Action.ROTATE]: rotate,
    [Action.LEFT]: moveLeft,
    [Action.RIGHT]: moveRight,
    [Action.DOWN]: moveDown,
    [Action.JUMP]: instantDrop
  }

const quiet = (state: State): Outcome => ({ state, events: [] })

const handleInput =
  (action: Action | null): StateTransformation =>
  (state) =>
    action === null
      ? state
      : R.pipe(
          ACTION_TO_TRANSFORMATION[action],
          R.ifElse(isValidState, R.identity, R.always(state))
        )(state)

const lockPiece = (state: State): Outcome => {
  const levelBefore = levelOf(state)
  const { board, cleared } = clearFullRows(
    mergePiece(at.board.view(state), at.piece.view(state))
  )
  const locked = R.pipe(
    at.board.set(board),
    at.score.over(R.add(lineClearScore(cleared, levelBefore))),
    at.linesCleared.over(R.add(cleared)),
    spawnNext()
  )(state)
  const levelAfter = levelOf(locked)

  const events: GameEvent[] = [{ type: 'pieceLocked' }]
  if (cleared > 0) events.push({ type: 'linesCleared', count: cleared })
  if (levelAfter > levelBefore)
    events.push({ type: 'levelUp', level: levelAfter })

  if (!isFailState(locked)) return { state: locked, events }

  events.push({ type: 'gameOver', finalScore: at.score.view(locked) })
  return {
    state: at.lastTick.set(at.lastTick.view(locked))(createInitialState()),
    events
  }
}

const gravity = (state: State): Outcome => {
  const ticked = at.nextFall.over((n) => (n > 0 ? n - 1 : speedOf(state)))(
    state
  )
  if (at.nextFall.view(ticked) !== 0) return quiet(ticked)
  return shouldPlaceDown(ticked) ? lockPiece(ticked) : quiet(moveDown(ticked))
}

const isTick = (timestamp: Timestamp, state: State) =>
  timestamp - at.lastTick.view(state) > EXECUTE_INTERVAL_MS

export const nextState = (
  state: State,
  action: Action | null,
  timestamp: Timestamp
): Outcome => {
  const afterInput = handleInput(action)(state)
  return isTick(timestamp, afterInput)
    ? gravity(at.lastTick.set(timestamp)(afterInput))
    : quiet(afterInput)
}
