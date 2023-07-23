import { TETRONIMO_MATRICES } from './constants'
import { viewBoard, viewSequence, viewTetronimo } from './logic.lens'
import { mergeTetronimoToBoard } from './logic.lib'
import { EMPTY_CELL, State } from './model'

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

    html += '<div id="stats"><div id="next">'
    for (const row of nextMatrix) {
      html += '<div class="row">'
      for (const cell of row) {
        html += `<div class="cell ${cell ? nextTetronimo : EMPTY_CELL}"></div>`
      }
      html += '</div>'
    }
    html += '</div></div>'

    target.innerHTML = html
  }

export const drawToDom = drawTo(gameElement)
