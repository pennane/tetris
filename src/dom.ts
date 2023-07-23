import { TETRONIMO_MATRICES } from './constants'
import {
  viewBoard,
  viewLinesCleared,
  viewScore,
  viewSequence,
  viewTetronimo
} from './logic.lens'
import { getLevel, mergeTetronimoToBoard } from './logic.lib'
import { EMPTY_CELL, Score, State } from './model'

const STORAGE_KEY = 'pennanen-dev-tetris-score'

let lastSequenceLength: number | null = null
let lastScore = 0

const storeScoresToLocalStorage = (scores: Score[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scores))
}

const loadScoresFromLocalStorage = (): Score[] => {
  try {
    const scores = JSON.parse(localStorage.getItem(STORAGE_KEY) || '')
    if (!Array.isArray(scores)) return []
    return scores.filter((s) => typeof s === 'number')
  } catch {
    return []
  }
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
    const level = getLevel(linesCleared)
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

export const draw = (state: State) => {
  drawBoardToDom(state)
  const sequenceLength = viewSequence(state).length
  if (lastSequenceLength !== sequenceLength) {
    drawStatsToDom(state)
    lastSequenceLength = sequenceLength
  }
}
