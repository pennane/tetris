import { TETRONIMO_MATRICES } from './constants'
import { viewBoard, viewScore, viewSequence, viewTetronimo } from './logic.lens'
import { mergeTetronimoToBoard } from './logic.lib'
import { EMPTY_CELL, Score, State } from './model'

let lastSequenceLength: number | null = null
let lastScore = 0
let previousBestScores: Score[] = []

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
  }

const drawStatsTo =
  (target: HTMLElement) =>
  (state: State): void => {
    let html = '<div id="next">'

    const nextTetronimo = viewSequence(state)[0]
    const nextMatrix = TETRONIMO_MATRICES[0][nextTetronimo]

    const score = viewScore(state)

    if (score < lastScore) {
      previousBestScores = previousBestScores
        .concat(lastScore)
        .slice(0, 5)
        .sort((a, b) => b - a)
    }

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

    lastScore = score
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
