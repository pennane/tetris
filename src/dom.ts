import { mergeTetronimoToBoard } from './logic.lib'
import { State } from './model'

const boardElement = document.getElementById('board')!
const drawTo =
  (target: HTMLElement) =>
  (state: State): void => {
    const board = mergeTetronimoToBoard(state[0], state[1])
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

export const drawToDom = drawTo(boardElement)
