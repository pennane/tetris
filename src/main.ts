import './style.css'

import * as R from 'ramda'
import { createBoardView, drawStats } from './dom'
import { TICK, input, run } from './logic/logic'
import { ticksDue } from './logic/logic.clock'
import { KEY_TO_ACTION, MAX_LEVEL, MIN_LEVEL } from './logic/logic.constants'
import { createInitialState, levelOf, startAtLevel } from './logic/logic.lib'
import type { Action, GameEvent, State, Timestamp } from './logic/logic.model'
import { SAVE_STORAGE_KEY, fromSave, toSave } from './logic/logic.persist'
import { SOUND_STATE_STORAGE_KEY } from './audio/audio.constants'
import { playEvent, setGlobalGain, startSoundtrack } from './audio/audio'
import {
  HIGH_SCORES_STORAGE_KEY,
  decodeHighScores,
  passesBest,
  recordScore
} from './scores'
import { createToast } from './toast/toast'
import { toastFor } from './toast/toast.messages'
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
const soundCheckbox = element('sound-checkbox') as HTMLInputElement
const showToast = createToast(element('toast'))

const NEW_BEST_TOAST = 'new best!'

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

const announce = (event: GameEvent) => {
  const toast = toastFor(event)
  if (toast) showToast(toast)
}

const handleEvent = (event: GameEvent) => {
  playEvent(event)
  announce(event)
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
  const newBest =
    currentState !== undefined &&
    passesBest(highScores)(currentState.score, state.score)
  currentState = state
  events.forEach(handleEvent)
  if (newBest) showToast(NEW_BEST_TOAST)
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

const devStartingLevel = () => {
  const level = Number(new URLSearchParams(location.search).get('level'))
  return import.meta.env.DEV && level >= MIN_LEVEL && level <= MAX_LEVEL
    ? level
    : null
}

const devStartingState = () => {
  const level = devStartingLevel()
  return level === null
    ? null
    : R.pipe(createInitialState, startAtLevel(level))(freshSeed())
}

const startGame = (e: KeyboardEvent) => {
  if (hasModifier(e)) return
  e.preventDefault()
  window.removeEventListener('keydown', startGame)
  window.addEventListener('keydown', queueAction)

  const initial =
    devStartingState() ??
    load(SAVE_STORAGE_KEY, fromSave) ??
    createInitialState(freshSeed())
  drawStats(statsElement, initial, highScores)
  frame(initial, [], performance.now())
  startSoundtrack(() => levelOf(currentState))
}

const applySoundSetting = (on: boolean) => {
  soundCheckbox.checked = on
  setGlobalGain(on ? 0.5 : 0)
}

soundCheckbox.addEventListener('change', () => {
  applySoundSetting(soundCheckbox.checked)
  store(SOUND_STATE_STORAGE_KEY, soundCheckbox.checked)
})
applySoundSetting(
  load(SOUND_STATE_STORAGE_KEY, boolean) ?? false
)
window.addEventListener('keydown', startGame)
