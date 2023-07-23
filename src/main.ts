import { KEY_TO_ACTION } from './constants'
import { drawToDom } from './dom'
import { nextState } from './logic'
import { createInitialState } from './logic.lib'
import { Action, State } from './model'

let queuedAction: Action | null = null

const queueAction = (e: KeyboardEvent) => (queuedAction = KEY_TO_ACTION[e.key])

const gameLoop = (state: State) => {
  drawToDom(state)
  queuedAction = null
  requestAnimationFrame(() => gameLoop(nextState(state, queuedAction)))
}

const startGameLoop = () => {
  window.removeEventListener('keydown', startGameLoop)
  window.addEventListener('keydown', queueAction)
  gameLoop(createInitialState())
}

window.addEventListener('keydown', startGameLoop)
