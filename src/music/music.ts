import { viewLevel } from '../logic/logic.lens'
import { M_CURRENT_STATE } from '../main'
import {
  LEVEL_TO_NOTE_TRANSFORMER,
  NOTE_TO_HZ,
  LEVEL_ONE_TETRIS_NOTES
} from './music.constants'
import { overDuration } from './music.lens'
import { createDistortionCurve, levelToMusicSpeedMultiplier } from './music.lib'
import { Note } from './music.model'

const audioContext = new AudioContext()

const globalGain = audioContext.createGain()

const distortion = audioContext.createWaveShaper()

distortion.curve = createDistortionCurve(20)
distortion.oversample = 'none'

const reverb = audioContext.createConvolver()

// Load an impulse response
fetch('../impulse-response.wav')
  .then((response) => response.arrayBuffer())
  .then((arrayBuffer) => audioContext.decodeAudioData(arrayBuffer))
  .then((audioBuffer) => {
    reverb.buffer = audioBuffer
  })
  .catch((err) => console.error(err))

const playNote = (note: Note, time: number) => {
  const oscillator = audioContext.createOscillator()
  const noteVolume = audioContext.createGain()

  oscillator.type = note[4]
  oscillator.frequency.value = NOTE_TO_HZ.get(note[0])!

  noteVolume.gain.value = note[2]

  if (note[3] === 'attack') {
    noteVolume.gain.setValueAtTime(0.01, time)
    noteVolume.gain.exponentialRampToValueAtTime(0.5, time + 0.5) // increase volume to the desired level over the attack duration
  } else if (note[3] === 'decay') {
    noteVolume.gain.setValueAtTime(note[2], time)
    noteVolume.gain.exponentialRampToValueAtTime(0.01, time + note[1]) // decrease volume to near 0 over the duration of the note
  } else if (note[3] === 'both') {
    noteVolume.gain.setValueAtTime(0.01, time)
    noteVolume.gain.exponentialRampToValueAtTime(0.5, time + 0.5) // increase volume to the desired level over the attack duration
    noteVolume.gain.setValueAtTime(note[2], time)
    noteVolume.gain.exponentialRampToValueAtTime(0.01, time + note[1]) // decrease volume to near 0 over the duration of the notex§
  }

  oscillator.connect(noteVolume)
  noteVolume.connect(distortion)
  distortion.connect(reverb)
  reverb.connect(globalGain)
  globalGain.connect(audioContext.destination)

  oscillator.start(time)
  oscillator.stop(time + note[1])

  return oscillator
}

const playIndefinite = (notes: Note[]) => {
  let currentTime = audioContext.currentTime
  let lastOscillator: OscillatorNode | null = null

  notes
    .map(LEVEL_TO_NOTE_TRANSFORMER(viewLevel(M_CURRENT_STATE)))
    .map(
      overDuration((s) => {
        const level = viewLevel(M_CURRENT_STATE)
        return s * levelToMusicSpeedMultiplier(level)
      })
    )
    .forEach((note) => {
      lastOscillator = playNote(note, currentTime)
      currentTime += note[1]
    })
  lastOscillator!.onended = () => playIndefinite(notes)
}

export const startSoundtrack = () => playIndefinite(LEVEL_ONE_TETRIS_NOTES)
export const setGlobalGain = (gain: number) => (globalGain.gain.value = gain)
