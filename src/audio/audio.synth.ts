import {
  ATTACK_SECONDS,
  EFFECTS_BUS_GAIN,
  MUSIC_BUS_GAIN,
  NOISE_SECONDS,
  PEAK_GAIN,
  PULSE_DUTY,
  PULSE_HARMONICS,
  SILENT_GAIN
} from './audio.constants'
import { createDistortionCurve, hz } from './audio.lib'
import type { Note, Seconds } from './audio.model'

export const audioContext = new AudioContext()

const gainNode = (gain: number) => {
  const node = audioContext.createGain()
  node.gain.value = gain
  return node
}

const master = gainNode(0)
export const musicOutput = gainNode(MUSIC_BUS_GAIN)
export const drivenBus = gainNode(1)
export const cleanBus = gainNode(1)
export const effectsBus = gainNode(EFFECTS_BUS_GAIN)
const drivenOutput = gainNode(1)
const distortion = audioContext.createWaveShaper()
distortion.oversample = 'none'
const reverb = audioContext.createConvolver()

drivenBus.connect(distortion)
distortion.connect(drivenOutput)
drivenOutput.connect(reverb)
cleanBus.connect(reverb)
reverb.connect(musicOutput)
musicOutput.connect(master)
effectsBus.connect(master)
master.connect(audioContext.destination)

fetch('../impulse-response.wav')
  .then((response) => response.arrayBuffer())
  .then((buffer) => audioContext.decodeAudioData(buffer))
  .then((impulse) => {
    reverb.buffer = impulse
  })
  .catch((err) => console.error(err))

const pulseCoefficients = (duty: number) => {
  const cosine = new Float32Array(PULSE_HARMONICS + 1)
  const sine = new Float32Array(PULSE_HARMONICS + 1)
  for (let n = 1; n <= PULSE_HARMONICS; n++) {
    cosine[n] = Math.sin(2 * Math.PI * n * duty) / (n * Math.PI)
    sine[n] = (1 - Math.cos(2 * Math.PI * n * duty)) / (n * Math.PI)
  }
  return { cosine, sine }
}

const pulseWave = (() => {
  const { cosine, sine } = pulseCoefficients(PULSE_DUTY)
  return audioContext.createPeriodicWave(cosine, sine)
})()

const noiseBuffer = (() => {
  const length = audioContext.sampleRate * NOISE_SECONDS
  const buffer = audioContext.createBuffer(1, length, audioContext.sampleRate)
  const samples = buffer.getChannelData(0)
  for (let i = 0; i < length; i++) samples[i] = Math.random() * 2 - 1
  return buffer
})()

let currentDrive: number | null = null

export const setDrive = (amount: number) => {
  if (amount === currentDrive) return
  currentDrive = amount
  distortion.curve = createDistortionCurve(amount)
}

export const setDrivenGain = (gain: number) => {
  drivenOutput.gain.value = gain
}

export const setMasterGain = (gain: number) => {
  master.gain.value = gain
}

const scheduleEnvelope = (
  gain: AudioParam,
  note: Note,
  start: Seconds,
  duration: Seconds
) => {
  const end = start + duration
  const attackEnd = start + Math.min(ATTACK_SECONDS, duration / 2)
  switch (note.mode) {
    case 'normal':
      gain.setValueAtTime(note.volume, start)
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

const noiseSource = () => {
  const source = audioContext.createBufferSource()
  source.buffer = noiseBuffer
  source.loop = true
  return source
}

const oscillatorFor = (note: Note) => {
  const oscillator = audioContext.createOscillator()
  oscillator.frequency.value = hz(note.pitch)
  if (note.instrument === 'pulse') oscillator.setPeriodicWave(pulseWave)
  else if (note.instrument !== 'noise') oscillator.type = note.instrument
  return oscillator
}

const sourceFor = (note: Note) =>
  note.instrument === 'noise' ? noiseSource() : oscillatorFor(note)

export const play = (
  note: Note,
  start: Seconds,
  duration: Seconds,
  destination: AudioNode
) => {
  const source = sourceFor(note)
  const volume = audioContext.createGain()
  scheduleEnvelope(volume.gain, note, start, duration)
  source.connect(volume)
  volume.connect(destination)
  source.start(start)
  source.stop(start + duration)
  return source
}
