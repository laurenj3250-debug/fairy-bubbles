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

  it('should always return score between 0 and 1', () => {
    let score = 0
    for (let i = 0; i < 1000; i++) {
      score = computeHabitScore(1.0, score, true)
      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThan(1.0)
    }
  })

  it('should handle monthly habits with minimal decay', () => {
    const monthlyFreq = 1.0 / 30.0
    let score = 0.8

    // Monthly habit should decay very slowly
    score = computeHabitScore(monthlyFreq, score, false)
    expect(score).toBeGreaterThan(0.79) // Less than 1% decay
  })

  it('should throw error for zero frequency', () => {
    expect(() => computeHabitScore(0, 0, true)).toThrow('Invalid frequency')
  })

  it('should throw error for negative frequency', () => {
    expect(() => computeHabitScore(-1, 0, true)).toThrow('Invalid frequency')
  })

  it('should throw error for NaN frequency', () => {
    expect(() => computeHabitScore(NaN, 0, true)).toThrow('Invalid frequency')
  })

  it('should throw error for Infinity frequency', () => {
    expect(() => computeHabitScore(Infinity, 0, true)).toThrow('Invalid frequency')
  })

  it('should throw error for NaN previousScore', () => {
    expect(() => computeHabitScore(1.0, NaN, true)).toThrow('Invalid previousScore')
  })

  it('should clamp previousScore > 1.0', () => {
    const score = computeHabitScore(1.0, 1.5, false)
    expect(score).toBeLessThan(1.0)
    expect(Number.isFinite(score)).toBe(true)
  })

  it('should clamp previousScore < 0', () => {
    const score = computeHabitScore(1.0, -0.5, true)
    expect(score).toBeGreaterThanOrEqual(0)
    expect(Number.isFinite(score)).toBe(true)
  })

  it('should handle very large frequency', () => {
    const score = computeHabitScore(100, 0, true)
    expect(Number.isFinite(score)).toBe(true)
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThan(1.0)
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

  it('should handle empty completions map', () => {
    const completions = new Map()
    const history = new HabitScoreHistory(1.0)
    const scores = history.computeScores(completions, '2025-01-01', '2025-01-03')

    expect(scores.length).toBe(3)
    expect(scores.every(s => s.completed === false)).toBe(true)
    expect(scores.every(s => s.score === 0)).toBe(true)
  })

  it('should throw error for invalid frequency in constructor', () => {
    expect(() => new HabitScoreHistory(0)).toThrow('Invalid frequency')
    expect(() => new HabitScoreHistory(-1)).toThrow('Invalid frequency')
    expect(() => new HabitScoreHistory(NaN)).toThrow('Invalid frequency')
  })

  it('should throw error for invalid date format', () => {
    const history = new HabitScoreHistory(1.0)
    const completions = new Map()
    expect(() => history.computeScores(completions, 'invalid', '2025-01-03')).toThrow('Invalid date format')
  })

  it('should throw error when startDate > endDate', () => {
    const history = new HabitScoreHistory(1.0)
    const completions = new Map()
    expect(() => history.computeScores(completions, '2025-01-05', '2025-01-03')).toThrow('must be before or equal')
  })
})
