import { SHAPES } from './logic/logic.constants'
import { levelOf, renderBoard } from './logic/logic.lib'
import { EMPTY_CELL } from './logic/logic.model'
import type { RenderCell, Score, State } from './logic/logic.model'

const cellClass = (cell: RenderCell): string =>
  typeof cell === 'string' ? cell : `${cell.ghostOf} G`

const rowsHtml = (rows: ReadonlyArray<ReadonlyArray<string>>) =>
  rows
    .map(
      (row) =>
        `<div class="row">${row
          .map((cls) => `<div class="cell ${cls}"></div>`)
          .join('')}</div>`
    )
    .join('')

export const drawBoard = (target: HTMLElement, state: State): void => {
  target.innerHTML = rowsHtml(renderBoard(state).map((r) => r.map(cellClass)))
}

export const drawStats = (
  target: HTMLElement,
  state: State,
  highScores: readonly Score[]
): void => {
  const [next] = state.sequence
  const preview = SHAPES[0][next].map((r) =>
    r.map((solid) => (solid ? next : EMPTY_CELL))
  )
  target.innerHTML =
    `<div id="state"><span id="level">LVL ${levelOf(state)}</span>` +
    `<span id="lines-cleared">(${state.linesCleared})</span></div>` +
    `<div id="next">${rowsHtml(preview)}</div>` +
    `<div id="score">${state.score}</div>` +
    `<div id="previous">${highScores.map((s) => `<span>${s}</span>`).join('')}</div>`
}
