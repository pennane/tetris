import type { Level } from '../logic/logic.model'
import {
  ATTACK_SECONDS,
  PEAK_GAIN,
  SILENT_GAIN
} from './audio.constants'
import {
  createDistortionCurve,
  hz,
  stepSecondsFor
} from './audio.lib'
import type { Note } from './audio.model'
import { LEAD } from './audio.song'

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

const scheduleEnvelope = (
  gain: AudioParam,
  note: Note,
  start: number,
  duration: number
) => {
  const end = start + duration
  const attackEnd = start + Math.min(ATTACK_SECONDS, duration / 2)
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

const oscillatorTypeOf = (note: Note): OscillatorType =>
  note.instrument === 'pulse' || note.instrument === 'noise' ? 'square' : note.instrument

const playNote = (note: Note, start: number, duration: number) => {
  const oscillator = audioContext.createOscillator()
  const volume = audioContext.createGain()
  oscillator.type = oscillatorTypeOf(note)
  oscillator.frequency.value = hz(note.pitch)
  scheduleEnvelope(volume.gain, note, start, duration)
  oscillator.connect(volume)
  volume.connect(distortion)
  oscillator.start(start)
  oscillator.stop(start + duration)
}

const playLoop = (getLevel: () => Level) => {
  const level = getLevel()
  const stepSeconds = stepSecondsFor(level)
  let time = audioContext.currentTime
  for (const note of LEAD.notes) {
    const duration = (note?.length ?? 1) * stepSeconds
    if (note) playNote(LEAD.arrangeFor(level)(note), time, duration)
    time += duration
  }
  setTimeout(() => playLoop(getLevel), (time - audioContext.currentTime) * 1000)
}

export const startSoundtrack = (getLevel: () => Level) => playLoop(getLevel)

export const setGlobalGain = (gain: number) => {
  globalGain.gain.value = gain
}
