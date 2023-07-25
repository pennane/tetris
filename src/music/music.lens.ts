import * as R from 'ramda'
import { Note } from './music.model'

const noteLens = R.lensIndex<Note, 0>(0)
export const viewNote = R.view(noteLens)
export const overNote = R.over(noteLens)
export const setNote = R.set(noteLens)

const noteDurationLens = R.lensIndex<Note, 1>(1)
export const viewDuration = R.view(noteDurationLens)
export const overDuration = R.over(noteDurationLens)
export const setDuration = R.set(noteDurationLens)

const noteVolumeLens = R.lensIndex<Note, 2>(2)
export const viewVolume = R.view(noteVolumeLens)
export const overVolume = R.over(noteVolumeLens)
export const setVolume = R.set(noteVolumeLens)

const waveformLens = R.lensIndex<Note, 4>(4)
export const viewWaveform = R.view(waveformLens)
export const overWaveform = R.over(waveformLens)
export const setWaveform = R.set(waveformLens)

const playmodeLens = R.lensIndex<Note, 3>(3)
export const viewPlaymode = R.view(playmodeLens)
export const overPlaymode = R.over(playmodeLens)
export const setPlaymode = R.set(playmodeLens)
