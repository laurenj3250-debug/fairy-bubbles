// GoalConnect/shared/lib/habitFrequency.test.ts
import { describe, it, expect } from 'vitest'
import {
  FrequencyType,
  Frequency,
  isValidFrequency,
  frequencyToDecimal,
  parseFrequency,
  getRequiredCompletions,
  DAILY_FREQUENCY,
  WEEKLY_FREQUENCY
} from './habitFrequency'
import { computeHabitScore } from './habitScoring'

describe('FrequencyType', () => {
  it('should have correct enum values', () => {
    expect(FrequencyType.DAILY).toBe('daily')
    expect(FrequencyType.WEEKLY).toBe('weekly')
    expect(FrequencyType.CUSTOM).toBe('custom')
  })
})

describe('isValidFrequency', () => {
  it('should validate daily frequency', () => {
    const freq: Frequency = { numerator: 1, denominator: 1, type: FrequencyType.DAILY }
    expect(isValidFrequency(freq)).toBe(true)
  })

  it('should validate weekly frequency', () => {
    const freq: Frequency = { numerator: 1, denominator: 7, type: FrequencyType.WEEKLY }
    expect(isValidFrequency(freq)).toBe(true)
  })

  it('should validate custom 3x per week', () => {
    const freq: Frequency = { numerator: 3, denominator: 7, type: FrequencyType.CUSTOM }
    expect(isValidFrequency(freq)).toBe(true)
  })

  it('should validate custom 2 times per 14 days', () => {
    const freq: Frequency = { numerator: 2, denominator: 14, type: FrequencyType.CUSTOM }
    expect(isValidFrequency(freq)).toBe(true)
  })

  it('should validate monthly (1/30)', () => {
    const freq: Frequency = { numerator: 1, denominator: 30, type: FrequencyType.CUSTOM }
    expect(isValidFrequency(freq)).toBe(true)
  })

  it('should reject zero numerator', () => {
    const freq: Frequency = { numerator: 0, denominator: 7, type: FrequencyType.CUSTOM }
    expect(isValidFrequency(freq)).toBe(false)
  })

  it('should reject zero denominator', () => {
    const freq: Frequency = { numerator: 1, denominator: 0, type: FrequencyType.DAILY }
    expect(isValidFrequency(freq)).toBe(false)
  })

  it('should reject negative numerator', () => {
    const freq: Frequency = { numerator: -1, denominator: 7, type: FrequencyType.CUSTOM }
    expect(isValidFrequency(freq)).toBe(false)
  })

  it('should reject negative denominator', () => {
    const freq: Frequency = { numerator: 1, denominator: -7, type: FrequencyType.CUSTOM }
    expect(isValidFrequency(freq)).toBe(false)
  })

  it('should reject numerator > denominator', () => {
    const freq: Frequency = { numerator: 8, denominator: 7, type: FrequencyType.CUSTOM }
    expect(isValidFrequency(freq)).toBe(false)
  })

  it('should reject denominator > 365', () => {
    const freq: Frequency = { numerator: 1, denominator: 366, type: FrequencyType.CUSTOM }
    expect(isValidFrequency(freq)).toBe(false)
  })

  it('should reject numerator > 365', () => {
    const freq: Frequency = { numerator: 366, denominator: 366, type: FrequencyType.CUSTOM }
    expect(isValidFrequency(freq)).toBe(false)
  })

  it('should reject fractional numerator', () => {
    const freq: Frequency = { numerator: 1.5, denominator: 7, type: FrequencyType.CUSTOM }
    expect(isValidFrequency(freq)).toBe(false)
  })

  it('should reject fractional denominator', () => {
    const freq: Frequency = { numerator: 1, denominator: 7.5, type: FrequencyType.CUSTOM }
    expect(isValidFrequency(freq)).toBe(false)
  })
})

describe('frequencyToDecimal', () => {
  it('should convert daily (1/1) to 1.0', () => {
    const freq: Frequency = { numerator: 1, denominator: 1, type: FrequencyType.DAILY }
    expect(frequencyToDecimal(freq)).toBe(1.0)
  })

  it('should convert weekly (1/7) to ~0.143', () => {
    const freq: Frequency = { numerator: 1, denominator: 7, type: FrequencyType.WEEKLY }
    expect(frequencyToDecimal(freq)).toBeCloseTo(0.1428571, 5)
  })

  it('should convert 3x/week (3/7) to ~0.429', () => {
    const freq: Frequency = { numerator: 3, denominator: 7, type: FrequencyType.CUSTOM }
    expect(frequencyToDecimal(freq)).toBeCloseTo(0.4285714, 5)
  })

  it('should convert monthly (1/30) to ~0.033', () => {
    const freq: Frequency = { numerator: 1, denominator: 30, type: FrequencyType.CUSTOM }
    expect(frequencyToDecimal(freq)).toBeCloseTo(0.0333333, 5)
  })

  it('should convert every other day (1/2) to 0.5', () => {
    const freq: Frequency = { numerator: 1, denominator: 2, type: FrequencyType.CUSTOM }
    expect(frequencyToDecimal(freq)).toBe(0.5)
  })

  it('should handle very low frequency (1/365)', () => {
    const freq: Frequency = { numerator: 1, denominator: 365, type: FrequencyType.CUSTOM }
    expect(frequencyToDecimal(freq)).toBeCloseTo(0.00274, 5)
  })
})

describe('parseFrequency', () => {
  it('should parse DAILY type', () => {
    const freq = parseFrequency(FrequencyType.DAILY)
    expect(freq.numerator).toBe(1)
    expect(freq.denominator).toBe(1)
    expect(freq.type).toBe(FrequencyType.DAILY)
  })

  it('should parse WEEKLY type', () => {
    const freq = parseFrequency(FrequencyType.WEEKLY)
    expect(freq.numerator).toBe(1)
    expect(freq.denominator).toBe(7)
    expect(freq.type).toBe(FrequencyType.WEEKLY)
  })

  it('should parse CUSTOM with valid inputs', () => {
    const freq = parseFrequency(FrequencyType.CUSTOM, 3, 7)
    expect(freq.numerator).toBe(3)
    expect(freq.denominator).toBe(7)
    expect(freq.type).toBe(FrequencyType.CUSTOM)
  })

  it('should throw on CUSTOM without numerator', () => {
    expect(() => parseFrequency(FrequencyType.CUSTOM, undefined, 7))
      .toThrow('Custom frequency requires both numerator and denominator')
  })

  it('should throw on CUSTOM without denominator', () => {
    expect(() => parseFrequency(FrequencyType.CUSTOM, 3, undefined))
      .toThrow('Custom frequency requires both numerator and denominator')
  })

  it('should throw on CUSTOM with invalid frequency', () => {
    expect(() => parseFrequency(FrequencyType.CUSTOM, 0, 7))
      .toThrow('Invalid frequency')
  })

  it('should throw on CUSTOM with numerator > denominator', () => {
    expect(() => parseFrequency(FrequencyType.CUSTOM, 8, 7))
      .toThrow('Invalid frequency')
  })
})

describe('getRequiredCompletions', () => {
  it('should calculate 3x/week for 7 days = 3', () => {
    const freq: Frequency = { numerator: 3, denominator: 7, type: FrequencyType.CUSTOM }
    expect(getRequiredCompletions(freq, 7)).toBe(3)
  })

  it('should calculate 3x/week for 14 days = 6', () => {
    const freq: Frequency = { numerator: 3, denominator: 7, type: FrequencyType.CUSTOM }
    expect(getRequiredCompletions(freq, 14)).toBe(6)
  })

  it('should calculate daily for 30 days = 30', () => {
    const freq: Frequency = { numerator: 1, denominator: 1, type: FrequencyType.DAILY }
    expect(getRequiredCompletions(freq, 30)).toBe(30)
  })

  it('should calculate weekly for 7 days = 1', () => {
    const freq: Frequency = { numerator: 1, denominator: 7, type: FrequencyType.WEEKLY }
    expect(getRequiredCompletions(freq, 7)).toBe(1)
  })

  it('should calculate weekly for 14 days = 2', () => {
    const freq: Frequency = { numerator: 1, denominator: 7, type: FrequencyType.WEEKLY }
    expect(getRequiredCompletions(freq, 14)).toBe(2)
  })

  it('should calculate monthly for 30 days = 1', () => {
    const freq: Frequency = { numerator: 1, denominator: 30, type: FrequencyType.CUSTOM }
    expect(getRequiredCompletions(freq, 30)).toBe(1)
  })

  it('should calculate monthly for 60 days = 2', () => {
    const freq: Frequency = { numerator: 1, denominator: 30, type: FrequencyType.CUSTOM }
    expect(getRequiredCompletions(freq, 60)).toBe(2)
  })

  it('should round up fractional results (weekly for 8 days = 2)', () => {
    const freq: Frequency = { numerator: 1, denominator: 7, type: FrequencyType.WEEKLY }
    // (8 * 1) / 7 = 1.14... should round to 2
    expect(getRequiredCompletions(freq, 8)).toBe(2)
  })

  it('should handle 3x/week for 10 days correctly', () => {
    const freq: Frequency = { numerator: 3, denominator: 7, type: FrequencyType.CUSTOM }
    // (10 * 3) / 7 = 4.28... should round to 5
    expect(getRequiredCompletions(freq, 10)).toBe(5)
  })

  it('should handle every other day for 10 days', () => {
    const freq: Frequency = { numerator: 1, denominator: 2, type: FrequencyType.CUSTOM }
    // (10 * 1) / 2 = 5
    expect(getRequiredCompletions(freq, 10)).toBe(5)
  })
})

describe('Preset constants', () => {
  it('should have correct DAILY_FREQUENCY', () => {
    expect(DAILY_FREQUENCY.numerator).toBe(1)
    expect(DAILY_FREQUENCY.denominator).toBe(1)
    expect(DAILY_FREQUENCY.type).toBe(FrequencyType.DAILY)
    expect(isValidFrequency(DAILY_FREQUENCY)).toBe(true)
  })

  it('should have correct WEEKLY_FREQUENCY', () => {
    expect(WEEKLY_FREQUENCY.numerator).toBe(1)
    expect(WEEKLY_FREQUENCY.denominator).toBe(7)
    expect(WEEKLY_FREQUENCY.type).toBe(FrequencyType.WEEKLY)
    expect(isValidFrequency(WEEKLY_FREQUENCY)).toBe(true)
  })
})

describe('Integration with habitScoring', () => {
  it('should work with computeHabitScore for daily frequency', () => {
    const freq = DAILY_FREQUENCY
    const decimal = frequencyToDecimal(freq)

    let score = 0
    for (let i = 0; i < 30; i++) {
      score = computeHabitScore(decimal, score, true)
    }

    expect(score).toBeCloseTo(0.798, 2)
  })

  it('should work with computeHabitScore for weekly frequency', () => {
    const freq = WEEKLY_FREQUENCY
    const decimal = frequencyToDecimal(freq)

    let score = 0
    score = computeHabitScore(decimal, score, true)

    expect(score).toBeGreaterThan(0)
    expect(score).toBeLessThan(1)
  })

  it('should work with computeHabitScore for custom 3x/week', () => {
    const freq: Frequency = { numerator: 3, denominator: 7, type: FrequencyType.CUSTOM }
    const decimal = frequencyToDecimal(freq)

    let score = 0
    for (let i = 0; i < 7; i++) {
      const completed = i % 2 === 0 // Complete 4 times in 7 days (more than required 3)
      score = computeHabitScore(decimal, score, completed)
    }

    expect(score).toBeGreaterThan(0)
  })
})
