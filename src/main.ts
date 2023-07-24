import { KEY_TO_ACTION } from './logic.constants.ts'
import { draw } from './dom'
import { nextState } from './logic'
import { createInitialState } from './logic.lib'
import { Action, State } from './logic.model.ts'
import { setGlobalGain, startSoundtrack } from './music.ts'

let queuedAction: Action | null = null
// Export state for external imperative bs
export let CURRENT_STATE: State

const queueAction = (e: KeyboardEvent) => {
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
  const action = KEY_TO_ACTION[e.key]
  if (!action) return
  e.preventDefault()
  queuedAction = action
}

const gameLoop = (state: State) => {
  CURRENT_STATE = state
  draw(state)
  queuedAction = null
  requestAnimationFrame(() => gameLoop(nextState(state, queuedAction)))
}

const startGameLoop = (e: KeyboardEvent) => {
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
  e.preventDefault()
  window.removeEventListener('keydown', startGameLoop)
  window.addEventListener('keydown', queueAction)
  gameLoop(createInitialState())
  startSoundtrack()
}

window.addEventListener('keydown', startGameLoop)

const musicCheckbox = document.getElementById(
  'music-checkbox'
)! as HTMLInputElement

musicCheckbox.addEventListener('change', function () {
  setGlobalGain(musicCheckbox.checked ? 0.5 : 0)
})
setGlobalGain(musicCheckbox.checked ? 0.5 : 0)
