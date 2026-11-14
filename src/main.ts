import './style.css'

import * as R from 'ramda'
import { createBoardView, drawStats } from './dom'
import { TICK, input, run } from './logic/logic'
import { ticksDue } from './logic/logic.clock'
import { KEY_TO_ACTION } from './logic/logic.constants'
import { createInitialState, levelOf } from './logic/logic.lib'
import type { Action, GameEvent, State, Timestamp } from './logic/logic.model'
import { SAVE_STORAGE_KEY, fromSave, toSave } from './logic/logic.persist'
import { SOUND_STATE_STORAGE_KEY } from './audio/audio.constants'
import { setGlobalGain, startSoundtrack } from './audio/audio'
import { HIGH_SCORES_STORAGE_KEY, decodeHighScores, recordScore } from './scores'
import { boolean } from './util/decode'
import { freshSeed } from './util/random'
import { load, store } from './util/storage'

const element = (id: string) => {
  const el = document.getElementById(id)
  if (!el) throw new Error(`Missing #${id}`)
  return el
}
const drawBoard = createBoardView(element('board'))
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

const takeMessages = (ticks: number) => {
  const action = queuedAction
  queuedAction = null
  return [...(action ? [input(action)] : []), ...R.repeat(TICK, ticks)]
}

const frame = (
  state: State,
  events: readonly GameEvent[],
  lastTick: Timestamp
) => {
  currentState = state
  events.forEach(handleEvent)
  drawBoard(state)
  if (events.length > 0) {
    drawStats(statsElement, state, highScores)
    store(SAVE_STORAGE_KEY, toSave(state))
  }
  requestAnimationFrame((now) => {
    const clock = ticksDue(lastTick, now)
    const msgs = takeMessages(clock.ticks)
    const outcome = msgs.length > 0 ? run(state, msgs) : { value: state, events: [] }
    frame(outcome.value, outcome.events, clock.last)
  })
}

const startGame = (e: KeyboardEvent) => {
  if (hasModifier(e)) return
  e.preventDefault()
  window.removeEventListener('keydown', startGame)
  window.addEventListener('keydown', queueAction)

  const initial =
    load(SAVE_STORAGE_KEY, fromSave) ?? createInitialState(freshSeed())
  drawStats(statsElement, initial, highScores)
  frame(initial, [], performance.now())
  startSoundtrack(() => levelOf(currentState))
}

const applyMusicSetting = (on: boolean) => {
  musicCheckbox.checked = on
  setGlobalGain(on ? 0.5 : 0)
}

musicCheckbox.addEventListener('change', () => {
  applyMusicSetting(musicCheckbox.checked)
  store(SOUND_STATE_STORAGE_KEY, musicCheckbox.checked)
})
applyMusicSetting(
  load(SOUND_STATE_STORAGE_KEY, boolean) ?? false
)
window.addEventListener('keydown', startGame)
