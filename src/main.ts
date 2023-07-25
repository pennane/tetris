import { KEY_TO_ACTION } from './logic/logic.constants.ts'
import { draw } from './dom'
import './style.css'

import { setGlobalGain, startSoundtrack } from './music/music.ts'
import { createInitialState } from './logic/logic.lib.ts'
import { Action, State } from './logic/logic.model.ts'
import { nextState } from './logic/logic.ts'
import { load, store } from './util/storage.ts'

// Export state for external imperative bs
export let CURRENT_STATE: State

let queuedAction: Action | null = null

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

const MUSIC_STATE_STORAGE_KEY = 'music-state'

musicCheckbox.checked = load(MUSIC_STATE_STORAGE_KEY, (v) =>
  typeof v === 'boolean' ? v : false
)

musicCheckbox.addEventListener('change', () => {
  const checked = musicCheckbox.checked
  setGlobalGain(checked ? 0.5 : 0)
  store(JSON.stringify(checked), MUSIC_STATE_STORAGE_KEY)
})

setGlobalGain(musicCheckbox.checked ? 0.5 : 0)
