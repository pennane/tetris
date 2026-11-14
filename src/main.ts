import './style.css'

import { drawBoard, drawStats } from './dom'
import { nextState } from './logic/logic'
import { KEY_TO_ACTION } from './logic/logic.constants'
import { createInitialState, levelOf } from './logic/logic.lib'
import type { Action, GameEvent, State } from './logic/logic.model'
import { SAVE_STORAGE_KEY, fromSave, toSave } from './logic/logic.persist'
import { MUSIC_STATE_STORAGE_KEY } from './music/music.constants'
import { setGlobalGain, startSoundtrack } from './music/music'
import { HIGH_SCORES_STORAGE_KEY, decodeHighScores, recordScore } from './scores'
import { load, store } from './util/storage'

const element = (id: string) => {
  const el = document.getElementById(id)
  if (!el) throw new Error(`Missing #${id}`)
  return el
}
const boardElement = element('board')
const statsElement = element('stats')
const musicCheckbox = element('music-checkbox') as HTMLInputElement

let currentState: State
let queuedAction: Action | null = null
let highScores = load(HIGH_SCORES_STORAGE_KEY, decodeHighScores)

const hasModifier = (e: KeyboardEvent) =>
  e.metaKey || e.ctrlKey || e.shiftKey || e.altKey

const queueAction = (e: KeyboardEvent) => {
  if (hasModifier(e)) return
  const action = KEY_TO_ACTION[e.key]
  if (!action) return
  e.preventDefault()
  queuedAction = action
}

const handleEvent = (event: GameEvent) => {
  if (event.type === 'gameOver') {
    highScores = recordScore(highScores, event.finalScore)
    store(HIGH_SCORES_STORAGE_KEY, highScores)
  }
}

const frame = (state: State, events: readonly GameEvent[]) => {
  currentState = state
  events.forEach(handleEvent)
  drawBoard(boardElement, state)
  if (events.length > 0) {
    drawStats(statsElement, state, highScores)
    store(SAVE_STORAGE_KEY, toSave(state))
  }
  requestAnimationFrame((timestamp) => {
    const action = queuedAction
    queuedAction = null
    const outcome = nextState(state, action, timestamp)
    frame(outcome.state, outcome.events)
  })
}

const startGame = (e: KeyboardEvent) => {
  if (hasModifier(e)) return
  e.preventDefault()
  window.removeEventListener('keydown', startGame)
  window.addEventListener('keydown', queueAction)

  const initial = load(SAVE_STORAGE_KEY, fromSave) ?? createInitialState()
  drawStats(statsElement, initial, highScores)
  frame(initial, [])
  startSoundtrack(() => levelOf(currentState))
}

const applyMusicSetting = (on: boolean) => {
  musicCheckbox.checked = on
  setGlobalGain(on ? 0.5 : 0)
}

musicCheckbox.addEventListener('change', () => {
  applyMusicSetting(musicCheckbox.checked)
  store(MUSIC_STATE_STORAGE_KEY, musicCheckbox.checked)
})
applyMusicSetting(
  load(MUSIC_STATE_STORAGE_KEY, (v) => (typeof v === 'boolean' ? v : false))
)
window.addEventListener('keydown', startGame)
