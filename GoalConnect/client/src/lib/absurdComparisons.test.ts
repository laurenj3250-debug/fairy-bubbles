import { describe, it, expect } from 'vitest';
import {
  calculateElephantsLifted,
  calculateEiffelTowers,
  calculateOfficeEpisodes,
  calculateBananasOfEnergy,
  formatAbsurdComparison,
} from './absurdComparisons';

describe('absurdComparisons', () => {
  describe('calculateElephantsLifted', () => {
    // Formula: (bodyWeight * totalAttempts) / 13000 lbs (avg elephant)
    it('calculates correctly with default body weight', () => {
      // 150 lbs * 500 attempts = 75,000 lbs / 13,000 = 5.77 elephants
      const result = calculateElephantsLifted(500);
      expect(result).toBeCloseTo(5.77, 1);
    });

    it('accepts custom body weight', () => {
      // 180 lbs * 100 attempts = 18,000 lbs / 13,000 = 1.38 elephants
      const result = calculateElephantsLifted(100, 180);
      expect(result).toBeCloseTo(1.38, 1);
    });

    it('handles zero attempts', () => {
      expect(calculateElephantsLifted(0)).toBe(0);
    });
  });

  describe('calculateEiffelTowers', () => {
    // Formula: (totalSends * 12 ft avg problem height) / 1063 ft
    it('calculates correctly', () => {
      // 200 sends * 12 ft = 2400 ft / 1063 = 2.26 towers
      const result = calculateEiffelTowers(200);
      expect(result).toBeCloseTo(2.26, 1);
    });

    it('handles zero sends', () => {
      expect(calculateEiffelTowers(0)).toBe(0);
    });

    it('handles large numbers', () => {
      // 1000 sends = 12000 ft / 1063 = 11.29 towers
      const result = calculateEiffelTowers(1000);
      expect(result).toBeCloseTo(11.29, 1);
    });
  });

  describe('calculateOfficeEpisodes', () => {
    // Formula: totalMinutes / 22 (episode length)
    it('calculates correctly', () => {
      // 1200 minutes / 22 = 54.5 episodes
      const result = calculateOfficeEpisodes(1200);
      expect(result).toBeCloseTo(54.5, 1);
    });

    it('handles zero minutes', () => {
      expect(calculateOfficeEpisodes(0)).toBe(0);
    });
  });

  describe('calculateBananasOfEnergy', () => {
    // Formula: (totalAttempts * 50 cal) / 105 cal per banana
    it('calculates correctly', () => {
      // 500 attempts * 50 cal = 25000 cal / 105 = 238 bananas
      const result = calculateBananasOfEnergy(500);
      expect(result).toBeCloseTo(238, 0);
    });

    it('handles zero attempts', () => {
      expect(calculateBananasOfEnergy(0)).toBe(0);
    });
  });

  describe('formatAbsurdComparison', () => {
    it('formats small numbers without decimals', () => {
      expect(formatAbsurdComparison(2, 'elephants')).toBe('2 elephants');
    });

    it('formats fractional numbers nicely', () => {
      expect(formatAbsurdComparison(5.77, 'elephants')).toBe('5.8 elephants');
    });

    it('handles singular vs plural', () => {
      expect(formatAbsurdComparison(1, 'elephant')).toBe('1 elephant');
      expect(formatAbsurdComparison(0.5, 'Eiffel Tower')).toBe('0.5 Eiffel Towers');
    });

    it('handles very large numbers', () => {
      expect(formatAbsurdComparison(1234.5, 'bananas')).toBe('1,234.5 bananas');
    });
  });
});
