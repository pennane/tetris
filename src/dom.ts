import {
  PERSISTED_STATE_STORAGE_KEY,
  TETRONIMO_MATRICES
} from './logic/logic.constants'
import {
  viewBoard,
  viewTetronimo,
  viewScore,
  viewLinesCleared,
  viewLevel,
  viewSequence
} from './logic/logic.lens'
import { mergeTetronimoToBoard } from './logic/logic.lib'
import { Score, State, EMPTY_CELL } from './logic/logic.model'
import { load, store } from './util/storage'

const SCORE_STORAGE_KEY = 'score'

let lastSequenceLength: number | null = null
let lastScore = 0

const storeScoresToLocalStorage = (scores: Score[]) => {
  store(scores, SCORE_STORAGE_KEY)
}

const loadScoresFromLocalStorage = (): Score[] => {
  const scores = load(SCORE_STORAGE_KEY, (v) => {
    if (!Array.isArray(v)) return []
    return v.filter((s): s is number => typeof s === 'number')
  })
  return scores
}

let previousBestScores: Score[] = loadScoresFromLocalStorage()

const boardElement = document.getElementById('board')!
const statsElement = document.getElementById('stats')!
const drawBoardTo =
  (target: HTMLElement) =>
  (state: State): void => {
    const board = mergeTetronimoToBoard(viewBoard(state), viewTetronimo(state))
    let html = ''
    for (const row of board) {
      html += '<div class="row">'
      for (const cell of row) {
        html += `<div class="cell ${cell}"></div>`
      }
      html += '</div>'
    }

    target.innerHTML = html
    const score = viewScore(state)

    if (score < lastScore) {
      previousBestScores = previousBestScores
        .concat(lastScore)
        .sort((a, b) => b - a)
        .slice(0, 5)
      storeScoresToLocalStorage(previousBestScores)
    }
    lastScore = score
  }

const drawStatsTo =
  (target: HTMLElement) =>
  (state: State): void => {
    let html = ''

    const linesCleared = viewLinesCleared(state)
    const level = viewLevel(state)
    html += `<div id="state"><span id="level">LVL ${level}</span><span id="lines-cleared">(${linesCleared})</span></div>`

    const nextTetronimo = viewSequence(state)[0]
    const nextMatrix = TETRONIMO_MATRICES[0][nextTetronimo]

    const score = viewScore(state)

    html += '<div id="next">'
    for (const row of nextMatrix) {
      html += '<div class="row">'
      for (const cell of row) {
        html += `<div class="cell ${cell ? nextTetronimo : EMPTY_CELL}"></div>`
      }
      html += '</div>'
    }
    html += `</div><div id="score">${score}</div>`

    html += `<div id="previous">${previousBestScores
      .map((s) => `<span>${s}</span>`)
      .join('')}</div>`

    target.innerHTML = html
  }

const drawBoardToDom = drawBoardTo(boardElement)
const drawStatsToDom = drawStatsTo(statsElement)

export const drawAndPersist = (state: State) => {
  drawBoardToDom(state)
  const sequenceLength = viewSequence(state).length
  if (lastSequenceLength !== sequenceLength) {
    store(state, PERSISTED_STATE_STORAGE_KEY)
    drawStatsToDom(state)
    lastSequenceLength = sequenceLength
  }
}
