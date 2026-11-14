import * as R from 'ramda'
import type { Level } from '../logic/logic.model'
import {
  ATTACK_SECONDS,
  PEAK_GAIN,
  SILENT_GAIN
} from './music.constants'
import { noteAt } from './music.lens'
import {
  createDistortionCurve,
  hz,
  levelToDurationMultiplier
} from './music.lib'
import type { Note } from './music.model'
import { SOUNDTRACK, noteTransformerFor } from './music.song'

const audioContext = new AudioContext()
const globalGain = audioContext.createGain()
const distortion = audioContext.createWaveShaper()
distortion.curve = createDistortionCurve(20)
distortion.oversample = 'none'
const reverb = audioContext.createConvolver()

distortion.connect(reverb)
reverb.connect(globalGain)
globalGain.connect(audioContext.destination)

fetch('../impulse-response.wav')
  .then((response) => response.arrayBuffer())
  .then((buffer) => audioContext.decodeAudioData(buffer))
  .then((impulse) => {
    reverb.buffer = impulse
  })
  .catch((err) => console.error(err))

const scheduleEnvelope = (gain: AudioParam, note: Note, start: number) => {
  const end = start + note.duration
  const attackEnd = start + Math.min(ATTACK_SECONDS, note.duration / 2)
  switch (note.mode) {
    case 'normal':
      gain.value = note.volume
      return
    case 'attack':
      gain.setValueAtTime(SILENT_GAIN, start)
      gain.exponentialRampToValueAtTime(PEAK_GAIN, attackEnd)
      return
    case 'decay':
      gain.setValueAtTime(note.volume, start)
      gain.exponentialRampToValueAtTime(SILENT_GAIN, end)
      return
    case 'both':
      gain.setValueAtTime(SILENT_GAIN, start)
      gain.exponentialRampToValueAtTime(PEAK_GAIN, attackEnd)
      gain.exponentialRampToValueAtTime(SILENT_GAIN, end)
      return
  }
}

const playNote = (note: Note, start: number): OscillatorNode => {
  const oscillator = audioContext.createOscillator()
  const volume = audioContext.createGain()
  oscillator.type = note.waveform
  oscillator.frequency.value = hz(note.pitch)
  scheduleEnvelope(volume.gain, note, start)
  oscillator.connect(volume)
  volume.connect(distortion)
  oscillator.start(start)
  oscillator.stop(start + note.duration)
  return oscillator
}

const playLoop = (notes: readonly Note[], getLevel: () => Level) => {
  const level = getLevel()
  const durationMultiplier = levelToDurationMultiplier(level)
  const arranged = notes
    .map(noteTransformerFor(level))
    .map(noteAt.duration.over(R.multiply(durationMultiplier)))

  let time = audioContext.currentTime
  let last: OscillatorNode | null = null
  for (const note of arranged) {
    last = playNote(note, time)
    time += note.duration
  }
  if (last) last.onended = () => playLoop(notes, getLevel)
}

export const startSoundtrack = (getLevel: () => Level) =>
  playLoop(SOUNDTRACK, getLevel)

export const setGlobalGain = (gain: number) => {
  globalGain.gain.value = gain
}
