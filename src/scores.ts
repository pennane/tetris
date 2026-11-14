import * as R from 'ramda'
import type { Score } from './logic/logic.model'
import { arrayOf, count } from './util/decode'

export const HIGH_SCORES_STORAGE_KEY = 'score'
const KEPT = 5

const highestFirst = R.descend(R.identity<Score>)

export const decodeHighScores = (v: unknown): readonly Score[] =>
  arrayOf(count)(v) ?? []

export const recordScore = (scores: readonly Score[], score: Score) =>
  score > 0 ? [...scores, score].sort(highestFirst).slice(0, KEPT) : scores

export const passesBest =
  ([best]: readonly Score[]) =>
  (before: Score, after: Score) =>
    best !== undefined && before <= best && after > best
