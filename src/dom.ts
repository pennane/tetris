import { TETRONIMO_MATRICES } from './constants'
import { viewBoard, viewScore, viewSequence, viewTetronimo } from './logic.lens'
import { mergeTetronimoToBoard } from './logic.lib'
import { EMPTY_CELL, Score, State } from './model'

let lastScore = 0
let previousBestScores: Score[] = []

const gameElement = document.getElementById('game')!
const drawTo =
  (target: HTMLElement) =>
  (state: State): void => {
    const board = mergeTetronimoToBoard(viewBoard(state), viewTetronimo(state))
    let html = '<div id="board">'
    for (const row of board) {
      html += '<div class="row">'
      for (const cell of row) {
        html += `<div class="cell ${cell}"></div>`
      }
      html += '</div>'
    }
    html += '</div>'

    const nextTetronimo = viewSequence(state)[0]
    const nextMatrix = TETRONIMO_MATRICES[0][nextTetronimo]

    const score = viewScore(state)

    if (score < lastScore) {
      previousBestScores = previousBestScores
        .concat(lastScore)
        .slice(0, 5)
        .sort((a, b) => a - b)
    }

    html += '<div id="stats"><div id="next">'
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
      .join('')}</div >`

    target.innerHTML = html

    lastScore = score
  }

export const drawToDom = drawTo(gameElement)
