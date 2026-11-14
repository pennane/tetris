import type { GameEvent, Level } from '../logic/logic.model'
import {
  CUE_STEP_SECONDS,
  LOOKAHEAD_SECONDS,
  MUSIC_BUS_GAIN,
  MUSIC_FADE_SECONDS,
  SCHEDULER_INTERVAL_MS
} from './audio.constants'
import { cueFor, cueSeconds } from './audio.cues'
import type { Cue } from './audio.cues'
import { notesAt, songLength, stepSecondsFor, stepsOf } from './audio.lib'
import type { Seconds, Steps } from './audio.model'
import { SONG, driveFor } from './audio.song'
import {
  audioContext,
  effectsBus,
  musicBus,
  play,
  setDrive,
  setMasterGain
} from './audio.synth'

const SONG_LENGTH = songLength(SONG)

let step: Steps = 0
let nextStepTime: Seconds = 0
let scheduler: ReturnType<typeof setInterval> | null = null
const sounding = new Set<AudioScheduledSourceNode>()

const trackSounding = (source: AudioScheduledSourceNode) => {
  sounding.add(source)
  source.onended = () => sounding.delete(source)
}

const scheduleStep = (level: Level) => {
  const stepSeconds = stepSecondsFor(level)
  setDrive(driveFor(level))
  for (const note of notesAt(SONG, level, step)) {
    trackSounding(play(note, nextStepTime, note.length * stepSeconds, musicBus))
  }
  nextStepTime += stepSeconds
  step = (step + 1) % SONG_LENGTH
}

const scheduleAhead = (getLevel: () => Level) => () => {
  nextStepTime = Math.max(nextStepTime, audioContext.currentTime)
  while (nextStepTime < audioContext.currentTime + LOOKAHEAD_SECONDS) {
    scheduleStep(getLevel())
  }
}

export const startSoundtrack = (getLevel: () => Level) => {
  void audioContext.resume()
  if (scheduler !== null) return
  nextStepTime = audioContext.currentTime
  scheduler = setInterval(scheduleAhead(getLevel), SCHEDULER_INTERVAL_MS)
}

const playCue = (cue: Cue) => {
  let start = audioContext.currentTime
  for (const note of cue) {
    const duration = stepsOf(note) * CUE_STEP_SECONDS
    if (note) play(note, start, duration, effectsBus)
    start += duration
  }
}

const stopAt = (time: Seconds) => (source: AudioScheduledSourceNode) =>
  source.stop(time)

const restartMusicAfter = (pause: Seconds) => {
  const now = audioContext.currentTime
  const fadeEnd = now + MUSIC_FADE_SECONDS
  const restartAt = now + pause
  musicBus.gain.cancelScheduledValues(now)
  musicBus.gain.setValueAtTime(musicBus.gain.value, now)
  musicBus.gain.linearRampToValueAtTime(0, fadeEnd)
  musicBus.gain.setValueAtTime(MUSIC_BUS_GAIN, restartAt)
  sounding.forEach(stopAt(fadeEnd))
  sounding.clear()
  step = 0
  nextStepTime = restartAt
}

export const playEvent = (event: GameEvent) => {
  const cue = cueFor(event)
  playCue(cue)
  if (event.type === 'gameOver') restartMusicAfter(cueSeconds(cue))
}

export const setGlobalGain = setMasterGain
