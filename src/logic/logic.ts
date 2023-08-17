import {
  ACTION_TO_TRANSFORMATION,
  EXECUTE_INTERVAL_MS,
  LINES_CLEARED_TO_SCORE
} from './logic.constants'
import {
  viewBoard,
  viewTetronimo,
  setBoard,
  viewNextFall,
  viewSequence,
  setTetronimo,
  setSequence,
  overScoreAndBoardAndLinesCleared,
  setSpeed,
  viewLevel,
  linesClearedToLevel,
  setLastExecuted,
  viewLastExecuted,
  setTimestamp
} from './logic.lens'
import {
  createInitialState,
  decreaseMoveTimer,
  createEmptyRow,
  createSequence,
  isFailState,
  isValidState,
  mergeTetronimoToBoard,
  moveDown,
  shouldPlaceDown,
  levelToSpeed
} from './logic.lib'
import { EMPTY_CELL, State, Action, StateTransformation } from './logic.model'

import * as R from 'ramda'

const placeDown: StateTransformation = (state) => {
  const mergedBoard = R.converge(mergeTetronimoToBoard, [
    viewBoard,
    viewTetronimo
  ])(state)

  return setBoard(mergedBoard, state)
}

const clearFullRows = overScoreAndBoardAndLinesCleared(
  (score, board, linesCleared) => {
    const filtered = board.filter((row) =>
      row.some((cell) => cell === EMPTY_CELL)
    )

    const amountCleared = board.length - filtered.length
    const additionalScore =
      (LINES_CLEARED_TO_SCORE[amountCleared] ?? 0) *
      linesClearedToLevel(linesCleared)

    return [
      score + additionalScore,
      R.repeat(createEmptyRow(), amountCleared).concat(filtered),
      linesCleared + amountCleared
    ]
  }
)

const nextTetronimo: StateTransformation = (state) => {
  const [head, ...tail] = viewSequence(state)
  return R.pipe(
    setTetronimo([head, 4, 0, 0]),
    setSequence(R.isEmpty(tail) ? createSequence() : tail)
  )(state)
}

const checkGameOver = R.when(isFailState, createInitialState)

const updateCurrentLevel: StateTransformation = (state) =>
  setSpeed(levelToSpeed(viewLevel(state)), state)

const handleFall = R.when(
  R.pipe(viewNextFall, R.equals(0)),
  R.ifElse(
    shouldPlaceDown,
    R.pipe(
      placeDown,
      nextTetronimo,
      clearFullRows,
      checkGameOver,
      updateCurrentLevel
    ),
    moveDown
  )
)

const handleInput =
  (action: Action | null) =>
  (state: State): State => {
    if (!action) return state
    const actionFunction = ACTION_TO_TRANSFORMATION[action]
    if (!actionFunction) return state
    const modifiedState = actionFunction(state)
    if (!isValidState(modifiedState)) return state
    return modifiedState
  }

const shouldExecute = (timestamp: number) =>
  R.pipe(
    viewLastExecuted,
    (last: number) => timestamp - last > EXECUTE_INTERVAL_MS
  )

const updateTimetamps = (timestamp: number) =>
  R.pipe(
    setTimestamp(timestamp),
    R.when(shouldExecute(timestamp), setLastExecuted(timestamp))
  )

export const nextState = (
  state: State,
  action: Action | null,
  timestamp: number
) =>
  R.pipe(
    handleInput(action),
    updateTimetamps(timestamp),
    decreaseMoveTimer,
    handleFall
  )(state)
