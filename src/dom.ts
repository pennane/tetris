import { SHAPES } from './logic/logic.constants'
import { levelOf, renderBoard } from './logic/logic.lib'
import { EMPTY_CELL } from './logic/logic.model'
import type { Board, Piece, RenderCell, Score, State } from './logic/logic.model'

const cellClass = (cell: RenderCell): string =>
  typeof cell === 'string' ? `cell ${cell}` : `cell ${cell.ghostOf} G`

const rowsHtml = (rows: ReadonlyArray<ReadonlyArray<string>>) =>
  rows
    .map(
      (row) =>
        `<div class="row">${row
          .map((cls) => `<div class="cell ${cls}"></div>`)
          .join('')}</div>`
    )
    .join('')

const createCells = (target: HTMLElement, rows: number, cols: number) => {
  target.replaceChildren()
  return Array.from({ length: rows }, () => {
    const row = document.createElement('div')
    row.className = 'row'
    target.appendChild(row)
    return Array.from({ length: cols }, () =>
      row.appendChild(document.createElement('div'))
    )
  })
}

export const createBoardView = (target: HTMLElement) => {
  let cells: HTMLElement[][] | null = null
  let drawnBoard: Board | null = null
  let drawnPiece: Piece | null = null

  return (state: State): void => {
    if (state.board === drawnBoard && state.piece === drawnPiece) return
    drawnBoard = state.board
    drawnPiece = state.piece
    const rendered = renderBoard(state)
    cells ??= createCells(target, rendered.length, rendered[0]?.length ?? 0)
    rendered.forEach((row, y) =>
      row.forEach((cell, x) => {
        const el = cells?.[y]?.[x]
        const cls = cellClass(cell)
        if (el && el.className !== cls) el.className = cls
      })
    )
  }
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
