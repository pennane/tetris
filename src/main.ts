import { KEY_TO_ACTION } from './constants'
import { drawToDom } from './dom'
import { nextState } from './logic'
import { createInitialState } from './logic.lib'
import { Action, State } from './model'

let queuedAction: Action | null = null

const queueAction = (e: KeyboardEvent) => {
  if (e.metaKey) return
  const action = KEY_TO_ACTION[e.key]
  if (!action) return
  e.preventDefault()
  queuedAction = action
}

const gameLoop = (state: State) => {
  drawToDom(state)
  queuedAction = null
  requestAnimationFrame(() => gameLoop(nextState(state, queuedAction)))
}

const startGameLoop = (e: KeyboardEvent) => {
  e.preventDefault()
  window.removeEventListener('keydown', startGameLoop)
  window.addEventListener('keydown', queueAction)
  gameLoop(createInitialState())
}

window.addEventListener('keydown', startGameLoop)
