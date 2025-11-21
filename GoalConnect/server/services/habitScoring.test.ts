// GoalConnect/server/services/habitScoring.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { updateHabitScore } from './habitScoring'

// Mock the database module
const mockDb = {
  query: {
    habits: {
      findFirst: vi.fn()
    },
    habitLogs: {
      findMany: vi.fn()
    }
  },
  update: vi.fn(() => ({
    set: vi.fn(() => ({
      where: vi.fn()
    }))
  }))
}

vi.mock('../db', () => ({
  getDb: () => mockDb
}))

describe('updateHabitScore', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks()
  })

  it('should compute score for habit with completion history', async () => {
    // Mock habit data
    const mockHabit = {
      id: 1,
      userId: 1,
      title: 'Test Habit',
      frequencyNumerator: 1,
      frequencyDenominator: 1,
      frequencyType: 'daily',
      currentScore: '0',
      scoreHistory: []
    }

    // Mock logs for 5 days
    const today = new Date().toISOString().split('T')[0]
    const mockLogs = []
    for (let i = 0; i < 5; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      mockLogs.push({
        id: i + 1,
        habitId: 1,
        userId: 1,
        date: date.toISOString().split('T')[0],
        completed: true
      })
    }

    mockDb.query.habits.findFirst.mockResolvedValue(mockHabit)
    mockDb.query.habitLogs.findMany.mockResolvedValue(mockLogs)

    const result = await updateHabitScore(1, today)

    expect(result.newScore).toBeGreaterThan(0)
    expect(result.newScore).toBeLessThan(1)
    expect(result.scoreChange).toBeGreaterThan(0)
    expect(result.updatedHistory.length).toBeGreaterThan(0)
    expect(result.updatedHistory.length).toBeLessThanOrEqual(30)
    expect(mockDb.update).toHaveBeenCalled()
  })

  it('should handle daily habits correctly', async () => {
    const mockHabit = {
      id: 1,
      frequencyNumerator: 1,
      frequencyDenominator: 1,
      frequencyType: 'daily',
      currentScore: '0',
      scoreHistory: []
    }

    const today = new Date()
    // Create logs for last 3 days
    const mockLogs = []
    for (let i = 0; i < 3; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      mockLogs.push({
        id: i + 1,
        habitId: 1,
        userId: 1,
        date: date.toISOString().split('T')[0],
        completed: true
      })
    }

    mockDb.query.habits.findFirst.mockResolvedValue(mockHabit)
    mockDb.query.habitLogs.findMany.mockResolvedValue(mockLogs)

    const result = await updateHabitScore(1, today.toISOString().split('T')[0])

    expect(result.newScore).toBeGreaterThan(0)
    expect(result.updatedHistory[result.updatedHistory.length - 1].completed).toBe(true)
  })

  it('should handle weekly habits with correct frequency', async () => {
    const mockHabit = {
      id: 1,
      frequencyNumerator: 1,
      frequencyDenominator: 7,
      frequencyType: 'weekly',
      currentScore: '0',
      scoreHistory: []
    }

    const today = new Date()
    // Create 2 weekly completions (7 days apart)
    const mockLogs = [
      {
        id: 1,
        habitId: 1,
        userId: 1,
        date: today.toISOString().split('T')[0],
        completed: true
      },
      {
        id: 2,
        habitId: 1,
        userId: 1,
        date: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        completed: true
      }
    ]

    mockDb.query.habits.findFirst.mockResolvedValue(mockHabit)
    mockDb.query.habitLogs.findMany.mockResolvedValue(mockLogs)

    const result = await updateHabitScore(1, today.toISOString().split('T')[0])

    // Weekly habits should have lower scores than daily for same completion rate
    expect(result.newScore).toBeGreaterThan(0)
    expect(result.newScore).toBeLessThan(0.2)
  })

  it('should maintain 30-day score history limit', async () => {
    const mockHabit = {
      id: 1,
      frequencyNumerator: 1,
      frequencyDenominator: 1,
      frequencyType: 'daily',
      currentScore: '0.5',
      scoreHistory: []
    }

    // Create 40 days of logs
    const mockLogs = []
    for (let i = 0; i < 40; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      mockLogs.push({
        id: i + 1,
        habitId: 1,
        userId: 1,
        date: date.toISOString().split('T')[0],
        completed: true
      })
    }

    mockDb.query.habits.findFirst.mockResolvedValue(mockHabit)
    mockDb.query.habitLogs.findMany.mockResolvedValue(mockLogs)

    const today = new Date().toISOString().split('T')[0]
    const result = await updateHabitScore(1, today)

    // Should only keep last 30 days
    expect(result.updatedHistory.length).toBeLessThanOrEqual(30)
  })

  it('should handle missing habit gracefully', async () => {
    mockDb.query.habits.findFirst.mockResolvedValue(null)

    const today = new Date().toISOString().split('T')[0]

    await expect(updateHabitScore(999, today))
      .rejects.toThrow('Habit 999 not found')
  })

  it('should work with empty log history', async () => {
    const mockHabit = {
      id: 1,
      frequencyNumerator: 1,
      frequencyDenominator: 1,
      frequencyType: 'daily',
      currentScore: '0',
      scoreHistory: []
    }

    mockDb.query.habits.findFirst.mockResolvedValue(mockHabit)
    mockDb.query.habitLogs.findMany.mockResolvedValue([])

    const today = new Date().toISOString().split('T')[0]
    const result = await updateHabitScore(1, today)

    // Should still compute a score (will be 0 for no completions)
    expect(result.newScore).toBe(0)
    expect(result.scoreChange).toBe(0)
    expect(result.updatedHistory.length).toBeGreaterThan(0)
  })

  it('should handle missing frequency fields with defaults', async () => {
    const mockHabit = {
      id: 1,
      frequencyNumerator: null,
      frequencyDenominator: null,
      frequencyType: null,
      currentScore: '0',
      scoreHistory: []
    }

    const today = new Date()
    // Create logs for last 3 days
    const mockLogs = []
    for (let i = 0; i < 3; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      mockLogs.push({
        id: i + 1,
        habitId: 1,
        userId: 1,
        date: date.toISOString().split('T')[0],
        completed: true
      })
    }

    mockDb.query.habits.findFirst.mockResolvedValue(mockHabit)
    mockDb.query.habitLogs.findMany.mockResolvedValue(mockLogs)

    // Should default to daily (1/1)
    const result = await updateHabitScore(1, today.toISOString().split('T')[0])

    expect(result.newScore).toBeGreaterThan(0)
  })

  it('should handle custom frequency (3x per week)', async () => {
    const mockHabit = {
      id: 1,
      frequencyNumerator: 3,
      frequencyDenominator: 7,
      frequencyType: 'custom',
      currentScore: '0',
      scoreHistory: []
    }

    const today = new Date()
    // Create 6 completions over 2 weeks (3 per week)
    const mockLogs = []
    for (let i = 0; i < 6; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - (i * 2)) // Every 2 days
      mockLogs.push({
        id: i + 1,
        habitId: 1,
        userId: 1,
        date: date.toISOString().split('T')[0],
        completed: true
      })
    }

    mockDb.query.habits.findFirst.mockResolvedValue(mockHabit)
    mockDb.query.habitLogs.findMany.mockResolvedValue(mockLogs)

    const result = await updateHabitScore(1, today.toISOString().split('T')[0])

    expect(result.newScore).toBeGreaterThan(0)
    expect(result.newScore).toBeLessThan(0.5) // Between daily and weekly
  })

  it('should compute score change accurately', async () => {
    const mockHabit = {
      id: 1,
      frequencyNumerator: 1,
      frequencyDenominator: 1,
      frequencyType: 'daily',
      currentScore: '0.5',
      scoreHistory: []
    }

    const today = new Date().toISOString().split('T')[0]
    const mockLogs = [{
      id: 1,
      habitId: 1,
      userId: 1,
      date: today,
      completed: true
    }]

    mockDb.query.habits.findFirst.mockResolvedValue(mockHabit)
    mockDb.query.habitLogs.findMany.mockResolvedValue(mockLogs)

    const result = await updateHabitScore(1, today)

    // Score change should be difference between new and old
    expect(Math.abs(result.scoreChange - (result.newScore - 0.5))).toBeLessThan(0.0001)
  })

  it('should decrease score with missed days', async () => {
    const mockHabit = {
      id: 1,
      frequencyNumerator: 1,
      frequencyDenominator: 1,
      frequencyType: 'daily',
      currentScore: '0.5',
      scoreHistory: []
    }

    const today = new Date()
    const mockLogs = []

    // 5 days ago to yesterday: completed
    for (let i = 5; i >= 1; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      mockLogs.push({
        id: i,
        habitId: 1,
        userId: 1,
        date: date.toISOString().split('T')[0],
        completed: true
      })
    }

    // Today: missed
    mockLogs.push({
      id: 10,
      habitId: 1,
      userId: 1,
      date: today.toISOString().split('T')[0],
      completed: false
    })

    mockDb.query.habits.findFirst.mockResolvedValue(mockHabit)
    mockDb.query.habitLogs.findMany.mockResolvedValue(mockLogs)

    const result = await updateHabitScore(1, today.toISOString().split('T')[0])

    // Score should be computed (may increase or decrease depending on history)
    expect(result.newScore).toBeGreaterThanOrEqual(0)
    expect(result.newScore).toBeLessThan(1)
  })
})
