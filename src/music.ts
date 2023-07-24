import { viewLevel } from './logic.lens'
import { CURRENT_STATE } from './main'
import {
  LEVEL_TO_NOTE_TRANSFORMER,
  NOTE_TO_HZ,
  TETRIS_NOTES
} from './music.constants'
import { overDuration } from './music.lens'
import { createDistortionCurve, levelToMusicSpeedMultiplier } from './music.lib'
import { NoteWithOctave, Note } from './music.model'

const audioContext = new AudioContext()

const distortion = audioContext.createWaveShaper()

distortion.curve = createDistortionCurve(20)
distortion.oversample = 'none'

const WRANGLED_TETRIS_NOTES = TETRIS_NOTES.map((note): Note => {
  const [n, octave] = note[0].split('')
  return [
    `${n}${Number(octave) - 2}` as NoteWithOctave,
    note[1],
    note[2], // (Math.sin(i + note[2]) + 0.05) * 0.01,
    'decay',
    'sine'
  ]
})

const playNote = (note: Note, time: number) => {
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()

  oscillator.type = note[4]
  oscillator.frequency.value = NOTE_TO_HZ.get(note[0])!

  gainNode.gain.value = note[2]

  if (note[3] === 'attack') {
    gainNode.gain.setValueAtTime(0.01, time)
    gainNode.gain.exponentialRampToValueAtTime(0.5, time + note[1]) // increase volume to the desired level over the attack duration
  } else if (note[3] === 'decay') {
    gainNode.gain.setValueAtTime(note[2], time)
    gainNode.gain.exponentialRampToValueAtTime(0.01, time + note[1]) // decrease volume to near 0 over the duration of the note
  }

  oscillator.connect(gainNode)
  gainNode.connect(distortion)
  distortion.connect(audioContext.destination)

  oscillator.start(time)
  oscillator.stop(time + note[1])

  return oscillator
}

const playIndefinite = (notes: Note[]) => {
  let currentTime = audioContext.currentTime
  let lastOscillator: OscillatorNode | null = null

  notes
    .map(LEVEL_TO_NOTE_TRANSFORMER(viewLevel(CURRENT_STATE)))
    .map(
      overDuration((s) => {
        const level = viewLevel(CURRENT_STATE)
        return s * levelToMusicSpeedMultiplier(level)
      })
    )
    .forEach((note) => {
      console.log(note[1])
      lastOscillator = playNote(note, currentTime)
      currentTime += note[1]
    })
  lastOscillator!.onended = () => playIndefinite(notes)
}

// Call the function to play notes
export const startSoundtrack = () => playIndefinite(WRANGLED_TETRIS_NOTES)
