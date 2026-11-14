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
import { notesAt, onBus, songLength, stepsOf } from './audio.lib'
import type { Seconds, Song, Steps } from './audio.model'
import { SONG, driveFor, drivenGainFor, stepSecondsFor } from './audio.song'
import {
  audioContext,
  cleanBus,
  drivenBus,
  effectsBus,
  musicOutput,
  play,
  setDrive,
  setDrivenGain,
  setMasterGain
} from './audio.synth'

const SONG_LENGTH = songLength(SONG)

const BUSES: readonly (readonly [Song, AudioNode])[] = [
  [SONG.filter(onBus('driven')), drivenBus],
  [SONG.filter(onBus('clean')), cleanBus]
]

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
  setDrivenGain(drivenGainFor(level))
  for (const [tracks, bus] of BUSES) {
    for (const note of notesAt(tracks, level, step)) {
      trackSounding(play(note, nextStepTime, note.length * stepSeconds, bus))
    }
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
  musicOutput.gain.cancelScheduledValues(now)
  musicOutput.gain.setValueAtTime(musicOutput.gain.value, now)
  musicOutput.gain.linearRampToValueAtTime(0, fadeEnd)
  musicOutput.gain.setValueAtTime(MUSIC_BUS_GAIN, restartAt)
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
