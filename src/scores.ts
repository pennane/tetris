import type { Score } from './logic/logic.model'

export const HIGH_SCORES_STORAGE_KEY = 'score'
const KEPT = 5

export const decodeHighScores = (v: unknown): readonly Score[] =>
  Array.isArray(v)
    ? v.filter((s): s is number => typeof s === 'number' && s >= 0)
    : []

export const recordScore = (
  scores: readonly Score[],
  score: Score
): readonly Score[] =>
  score > 0 ? [...scores, score].sort((a, b) => b - a).slice(0, KEPT) : scores
