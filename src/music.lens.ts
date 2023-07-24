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
