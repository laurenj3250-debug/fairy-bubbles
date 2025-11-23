import { describe, it, expect } from 'vitest';
import {
  gradeToNumeric,
  numericToGrade,
  getMaxGrade,
  aggregateGradeDistribution,
  calculateSendRate,
  calculateFlashRate,
} from './climbingStatsHelpers';

describe('climbingStatsHelpers', () => {
  describe('gradeToNumeric', () => {
    it('converts V grades to numbers', () => {
      expect(gradeToNumeric('V0')).toBe(0);
      expect(gradeToNumeric('V4')).toBe(4);
      expect(gradeToNumeric('V7')).toBe(7);
      expect(gradeToNumeric('V12+')).toBe(12);
    });

    it('handles edge cases', () => {
      expect(gradeToNumeric('V?')).toBe(0);
      expect(gradeToNumeric('')).toBe(0);
      expect(gradeToNumeric('invalid')).toBe(0);
    });
  });

  describe('numericToGrade', () => {
    it('converts numbers to V grades', () => {
      expect(numericToGrade(0)).toBe('V0');
      expect(numericToGrade(4)).toBe('V4');
      expect(numericToGrade(7)).toBe('V7');
    });

    it('handles high grades', () => {
      expect(numericToGrade(12)).toBe('V12+');
      expect(numericToGrade(15)).toBe('V12+');
    });

    it('handles negative/invalid', () => {
      expect(numericToGrade(-1)).toBe('V0');
    });
  });

  describe('getMaxGrade', () => {
    it('returns highest grade from sessions', () => {
      const sessions = [
        { maxGrade: 'V4' },
        { maxGrade: 'V7' },
        { maxGrade: 'V5' },
      ];
      expect(getMaxGrade(sessions as any)).toBe('V7');
    });

    it('handles empty sessions', () => {
      expect(getMaxGrade([])).toBe('V0');
    });

    it('handles undefined maxGrade', () => {
      const sessions = [
        { maxGrade: undefined },
        { maxGrade: 'V3' },
      ];
      expect(getMaxGrade(sessions as any)).toBe('V3');
    });
  });

  describe('aggregateGradeDistribution', () => {
    it('counts sends by grade', () => {
      const sessions = [
        {
          climbs: [
            { grade: 'V3', sent: true },
            { grade: 'V3', sent: true },
            { grade: 'V4', sent: true },
            { grade: 'V5', sent: false }, // not sent, shouldn't count
          ],
        },
      ];
      const dist = aggregateGradeDistribution(sessions as any);
      expect(dist['V3']).toBe(2);
      expect(dist['V4']).toBe(1);
      expect(dist['V5']).toBeUndefined();
    });

    it('aggregates across sessions', () => {
      const sessions = [
        { climbs: [{ grade: 'V3', sent: true }] },
        { climbs: [{ grade: 'V3', sent: true }, { grade: 'V4', sent: true }] },
      ];
      const dist = aggregateGradeDistribution(sessions as any);
      expect(dist['V3']).toBe(2);
      expect(dist['V4']).toBe(1);
    });

    it('handles empty sessions', () => {
      expect(aggregateGradeDistribution([])).toEqual({});
    });
  });

  describe('calculateSendRate', () => {
    it('calculates percentage correctly', () => {
      expect(calculateSendRate(80, 100)).toBe(80);
      expect(calculateSendRate(1, 4)).toBe(25);
    });

    it('handles zero attempts', () => {
      expect(calculateSendRate(0, 0)).toBe(0);
    });

    it('handles more sends than attempts (data error)', () => {
      expect(calculateSendRate(10, 5)).toBe(100); // cap at 100
    });
  });

  describe('calculateFlashRate', () => {
    it('calculates first-try send percentage', () => {
      const climbs = [
        { sent: true, attempts: 1 },  // flash
        { sent: true, attempts: 1 },  // flash
        { sent: true, attempts: 3 },  // not flash
        { sent: false, attempts: 5 }, // not sent
      ];
      expect(calculateFlashRate(climbs as any)).toBe(66.67); // 2/3 sends were flashes
    });

    it('handles no sends', () => {
      const climbs = [
        { sent: false, attempts: 5 },
      ];
      expect(calculateFlashRate(climbs as any)).toBe(0);
    });

    it('handles empty array', () => {
      expect(calculateFlashRate([])).toBe(0);
    });
  });
});
