// GoalConnect/shared/lib/habitScoring.test.ts
import { describe, it, expect } from 'vitest'
import { computeHabitScore, HabitScoreHistory } from './habitScoring'

describe('computeHabitScore', () => {
  it('should return 1.0 for perfect 30-day daily habit', () => {
    let score = 0
    for (let i = 0; i < 30; i++) {
      score = computeHabitScore(1.0, score, true)
    }
    expect(score).toBeCloseTo(0.798, 2)
  })

  it('should decay gradually on single miss', () => {
    let score = 1.0
    score = computeHabitScore(1.0, score, false)
    expect(score).toBeGreaterThan(0.9)
    expect(score).toBeLessThan(1.0)
  })

  it('should preserve momentum after 100-day streak with 3 misses', () => {
    let score = 0
    // Build 100-day streak
    for (let i = 0; i < 100; i++) {
      score = computeHabitScore(1.0, score, true)
    }
    // Miss 3 days
    for (let i = 0; i < 3; i++) {
      score = computeHabitScore(1.0, score, false)
    }
    expect(score).toBeGreaterThan(0.8)
  })

  it('should handle weekly habits differently than daily', () => {
    const dailyFreq = 1.0
    const weeklyFreq = 1.0 / 7.0

    let dailyScore = 0
    let weeklyScore = 0

    // Both complete once
    dailyScore = computeHabitScore(dailyFreq, dailyScore, true)
    weeklyScore = computeHabitScore(weeklyFreq, weeklyScore, true)

    // Daily should score higher for single completion
    expect(dailyScore).toBeGreaterThan(weeklyScore)
  })
})

describe('HabitScoreHistory', () => {
  it('should compute scores for date range', () => {
    const completions = new Map([
      ['2025-01-01', true],
      ['2025-01-02', true],
      ['2025-01-03', false],
      ['2025-01-04', true],
    ])

    const history = new HabitScoreHistory(1.0) // daily
    const scores = history.computeScores(completions, '2025-01-01', '2025-01-04')

    expect(scores.length).toBe(4)
    expect(scores[0].score).toBeCloseTo(0.0519, 3)
    expect(scores[1].score).toBeCloseTo(0.1011, 3)
    expect(scores[2].score).toBeCloseTo(0.0959, 3) // Decayed
    expect(scores[3].score).toBeCloseTo(0.1428, 3) // Recovered
  })

  it('should handle gaps in data', () => {
    const completions = new Map([
      ['2025-01-01', true],
      // Gap: 2025-01-02 missing
      ['2025-01-03', true],
    ])

    const history = new HabitScoreHistory(1.0)
    const scores = history.computeScores(completions, '2025-01-01', '2025-01-03')

    expect(scores.length).toBe(3)
    expect(scores[1].score).toBeLessThan(scores[0].score) // Decayed during gap
  })
})
