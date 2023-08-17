import './style.css'
import {
  KEY_TO_ACTION,
  PERSISTED_STATE_STORAGE_KEY
} from './logic/logic.constants.ts'
import { drawAndPersist } from './dom'

import { setGlobalGain, startSoundtrack } from './music/music.ts'
import { createInitialState } from './logic/logic.lib.ts'
import { Action, State } from './logic/logic.model.ts'
import { nextState } from './logic/logic.ts'
import { load, store } from './util/storage.ts'
import { MUSIC_STATE_STORAGE_KEY } from './music/music.constants.ts'

const musicCheckbox = document.getElementById(
  'music-checkbox'
)! as HTMLInputElement

// Export state for external imperative bs
export let M_CURRENT_STATE: State

let M_QUEUED_ACTION: Action | null = null

const queueAction = (e: KeyboardEvent) => {
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
  const action = KEY_TO_ACTION[e.key]
  if (!action) return
  e.preventDefault()
  M_QUEUED_ACTION = action
}

const gameLoop = (state: State) => {
  drawAndPersist(state)
  M_CURRENT_STATE = state
  M_QUEUED_ACTION = null

  requestAnimationFrame((timestamp) =>
    gameLoop(nextState(state, M_QUEUED_ACTION, timestamp))
  )
}

const startGameLoop = (e: KeyboardEvent) => {
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
  e.preventDefault()

  const persistedState = load(PERSISTED_STATE_STORAGE_KEY, (v): State | null =>
    typeof v === 'object' && !Array.isArray(v) && v !== null
      ? (v as State)
      : null
  )

  gameLoop(persistedState || createInitialState())
  startSoundtrack()

  window.removeEventListener('keydown', startGameLoop)
  window.addEventListener('keydown', queueAction)
}

const handleMusicCheckboxChange = () => {
  const checked = musicCheckbox.checked
  setGlobalGain(checked ? 0.5 : 0)
  store(checked, MUSIC_STATE_STORAGE_KEY)
}

const musicOn = load(MUSIC_STATE_STORAGE_KEY, (v) =>
  typeof v === 'boolean' ? v : false
)
musicCheckbox.checked = musicOn

setGlobalGain(musicOn ? 0.5 : 0)

musicCheckbox.addEventListener('change', handleMusicCheckboxChange)
window.addEventListener('keydown', startGameLoop)
