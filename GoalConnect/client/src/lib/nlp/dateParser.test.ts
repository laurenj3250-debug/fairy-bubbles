import { describe, it, expect, beforeEach, vi } from 'vitest';
import { parseDate, parseTime, parseDateAndTime } from './dateParser';

describe('dateParser', () => {
  beforeEach(() => {
    // Mock the current date to 2025-01-15 12:00:00
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T12:00:00'));
  });

  describe('parseDate', () => {
    it('should parse "today"', () => {
      const result = parseDate('today');
      expect(result).toBe('2025-01-15');
    });

    it('should parse "tomorrow"', () => {
      const result = parseDate('tomorrow');
      expect(result).toBe('2025-01-16');
    });

    it('should parse "next Monday"', () => {
      // 2025-01-15 is Wednesday, next Monday is 2025-01-20
      const result = parseDate('next Monday');
      expect(result).toBe('2025-01-20');
    });

    it('should parse "next week"', () => {
      const result = parseDate('next week');
      expect(result).toBe('2025-01-22');
    });

    it('should parse "in 3 days"', () => {
      const result = parseDate('in 3 days');
      expect(result).toBe('2025-01-18');
    });

    it('should parse "Jan 15"', () => {
      const result = parseDate('Jan 15');
      expect(result).toBe('2025-01-15');
    });

    it('should parse "January 20"', () => {
      const result = parseDate('January 20');
      expect(result).toBe('2025-01-20');
    });

    it('should parse ISO date "2025-01-20"', () => {
      const result = parseDate('2025-01-20');
      expect(result).toBe('2025-01-20');
    });

    it('should return null for invalid input', () => {
      const result = parseDate('invalid date');
      expect(result).toBeNull();
    });

    it('should handle "this week" (end of week)', () => {
      // End of current week (Saturday when week starts on Sunday)
      const result = parseDate('this week');
      expect(result).toBe('2025-01-18');
    });
  });

  describe('parseTime', () => {
    it('should parse "3pm"', () => {
      const result = parseTime('3pm');
      expect(result).toBe('15:00');
    });

    it('should parse "9am"', () => {
      const result = parseTime('9am');
      expect(result).toBe('09:00');
    });

    it('should parse "15:00"', () => {
      const result = parseTime('15:00');
      expect(result).toBe('15:00');
    });

    it('should parse "9:30am"', () => {
      const result = parseTime('9:30am');
      expect(result).toBe('09:30');
    });

    it('should parse "5:30pm"', () => {
      const result = parseTime('5:30pm');
      expect(result).toBe('17:30');
    });

    it('should parse "at 3pm"', () => {
      const result = parseTime('at 3pm');
      expect(result).toBe('15:00');
    });

    it('should parse "by 5pm"', () => {
      const result = parseTime('by 5pm');
      expect(result).toBe('17:00');
    });

    it('should return null for invalid input', () => {
      const result = parseTime('invalid time');
      expect(result).toBeNull();
    });

    it('should handle 12-hour format edge cases', () => {
      expect(parseTime('12pm')).toBe('12:00');
      expect(parseTime('12am')).toBe('00:00');
      expect(parseTime('11:59pm')).toBe('23:59');
    });
  });

  describe('parseDateAndTime', () => {
    it('should parse date and time together', () => {
      const result = parseDateAndTime('tomorrow 3pm');
      expect(result).toEqual({
        date: '2025-01-16',
        time: '15:00',
        raw: 'tomorrow 3pm',
      });
    });

    it('should parse "next Monday at 9am"', () => {
      const result = parseDateAndTime('next Monday at 9am');
      expect(result).toEqual({
        date: '2025-01-20',
        time: '09:00',
        raw: 'next Monday at 9am',
      });
    });

    it('should parse date only', () => {
      const result = parseDateAndTime('tomorrow');
      expect(result).toEqual({
        date: '2025-01-16',
        time: null,
        raw: 'tomorrow',
      });
    });

    it('should parse "Jan 15 at 3pm"', () => {
      const result = parseDateAndTime('Jan 15 at 3pm');
      expect(result).toEqual({
        date: '2025-01-15',
        time: '15:00',
        raw: 'Jan 15 at 3pm',
      });
    });

    it('should return null for invalid input', () => {
      const result = parseDateAndTime('not a date');
      expect(result).toBeNull();
    });

    it('should handle "in 3 days at 5:30pm"', () => {
      const result = parseDateAndTime('in 3 days at 5:30pm');
      expect(result).toEqual({
        date: '2025-01-18',
        time: '17:30',
        raw: 'in 3 days at 5:30pm',
      });
    });
  });
});
