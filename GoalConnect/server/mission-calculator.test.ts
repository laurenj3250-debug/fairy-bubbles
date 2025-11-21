import { describe, it, expect } from 'vitest';
import {
  calculateMissionParameters,
  calculateBaseXP,
  calculateBasePoints,
  type MissionParameters
} from './mission-calculator';
import { CLIMBING, GAMIFICATION } from '../shared/constants';

describe('mission-calculator', () => {
  describe('calculateMissionParameters', () => {
    describe('elevation-based duration calculation', () => {
      it('calculates single-day climb duration for mountains under 4000m', () => {
        const mountain = {
          id: 1,
          name: 'Test Peak',
          elevation: 3500,
          difficultyTier: 'intermediate',
          fatalityRate: '0.00',
          country: 'Test',
          range: 'Test Range',
          firstAscent: 2000,
          imageUrl: null,
          climbingSeason: 'summer',
          description: 'Test'
        };

        const result = calculateMissionParameters(mountain);
        expect(result.totalDays).toBe(CLIMBING.MISSION_DURATIONS.SINGLE_DAY_DURATION);
      });

      it('calculates week-long expedition duration for mountains 4000-5500m', () => {
        const mountain = {
          id: 2,
          name: 'Test Peak',
          elevation: 5000,
          difficultyTier: 'intermediate',
          fatalityRate: '0.00',
          country: 'Test',
          range: 'Test Range',
          firstAscent: 2000,
          imageUrl: null,
          climbingSeason: 'summer',
          description: 'Test'
        };

        const result = calculateMissionParameters(mountain);
        expect(result.totalDays).toBe(CLIMBING.MISSION_DURATIONS.WEEK_LONG_DURATION);
      });

      it('calculates multi-week climb duration for mountains 5500-7000m', () => {
        const mountain = {
          id: 3,
          name: 'Test Peak',
          elevation: 6500,
          difficultyTier: 'intermediate',
          fatalityRate: '0.00',
          country: 'Test',
          range: 'Test Range',
          firstAscent: 2000,
          imageUrl: null,
          climbingSeason: 'summer',
          description: 'Test'
        };

        const result = calculateMissionParameters(mountain);
        expect(result.totalDays).toBe(CLIMBING.MISSION_DURATIONS.MULTI_WEEK_DURATION);
      });

      it('calculates major expedition duration for mountains 7000-8000m', () => {
        const mountain = {
          id: 4,
          name: 'Test Peak',
          elevation: 7500,
          difficultyTier: 'intermediate',
          fatalityRate: '0.00',
          country: 'Test',
          range: 'Test Range',
          firstAscent: 2000,
          imageUrl: null,
          climbingSeason: 'summer',
          description: 'Test'
        };

        const result = calculateMissionParameters(mountain);
        expect(result.totalDays).toBe(CLIMBING.MISSION_DURATIONS.MAJOR_EXPEDITION_DURATION);
      });

      it('calculates extended expedition duration for 8000m+ peaks', () => {
        const mountain = {
          id: 5,
          name: 'Mount Everest',
          elevation: 8849,
          difficultyTier: 'elite',
          fatalityRate: '0.04',
          country: 'Nepal',
          range: 'Himalayas',
          firstAscent: 1953,
          imageUrl: null,
          climbingSeason: 'spring',
          description: 'Highest peak'
        };

        const result = calculateMissionParameters(mountain);
        expect(result.totalDays).toBe(CLIMBING.MISSION_DURATIONS.EIGHT_THOUSANDER_DURATION);
      });
    });

    describe('difficulty tier multipliers', () => {
      const createMountain = (tier: string) => ({
        id: 1,
        name: 'Test Peak',
        elevation: 5000,
        difficultyTier: tier,
        fatalityRate: '0.00',
        country: 'Test',
        range: 'Test Range',
        firstAscent: 2000,
        imageUrl: null,
        climbingSeason: 'summer',
        description: 'Test'
      });

      it('applies novice multiplier (0.8x)', () => {
        const mountain = createMountain('novice');
        const result = calculateMissionParameters(mountain);
        const expected = Math.round(CLIMBING.MISSION_DURATIONS.WEEK_LONG_DURATION * 0.8);
        expect(result.totalDays).toBe(expected);
      });

      it('applies intermediate multiplier (1.0x)', () => {
        const mountain = createMountain('intermediate');
        const result = calculateMissionParameters(mountain);
        expect(result.totalDays).toBe(CLIMBING.MISSION_DURATIONS.WEEK_LONG_DURATION);
      });

      it('applies advanced multiplier (1.2x)', () => {
        const mountain = createMountain('advanced');
        const result = calculateMissionParameters(mountain);
        const expected = Math.round(CLIMBING.MISSION_DURATIONS.WEEK_LONG_DURATION * 1.2);
        expect(result.totalDays).toBe(expected);
      });

      it('applies expert multiplier (1.4x)', () => {
        const mountain = createMountain('expert');
        const result = calculateMissionParameters(mountain);
        const expected = Math.round(CLIMBING.MISSION_DURATIONS.WEEK_LONG_DURATION * 1.4);
        expect(result.totalDays).toBe(expected);
      });

      it('applies elite multiplier (1.5x)', () => {
        const mountain = createMountain('elite');
        const result = calculateMissionParameters(mountain);
        const expected = Math.round(CLIMBING.MISSION_DURATIONS.WEEK_LONG_DURATION * 1.5);
        expect(result.totalDays).toBe(expected);
      });

      it('uses default multiplier for unknown tier', () => {
        const mountain = createMountain('unknown');
        const result = calculateMissionParameters(mountain);
        expect(result.totalDays).toBe(CLIMBING.MISSION_DURATIONS.WEEK_LONG_DURATION);
      });
    });

    describe('completion requirements based on fatality rate', () => {
      const createMountain = (fatalityRate: string) => ({
        id: 1,
        name: 'Test Peak',
        elevation: 5000,
        difficultyTier: 'intermediate',
        fatalityRate,
        country: 'Test',
        range: 'Test Range',
        firstAscent: 2000,
        imageUrl: null,
        climbingSeason: 'summer',
        description: 'Test'
      });

      it('requires 75% completion for fatality rate < 1% (easy)', () => {
        const mountain = createMountain('0.005');
        const result = calculateMissionParameters(mountain);
        expect(result.requiredCompletionPercent).toBe(75);
      });

      it('requires 75% completion for zero fatality rate', () => {
        const mountain = createMountain('0.00');
        const result = calculateMissionParameters(mountain);
        expect(result.requiredCompletionPercent).toBe(75);
      });

      it('requires 80% completion for fatality rate 1-3% (moderate)', () => {
        const mountain = createMountain('0.02');
        const result = calculateMissionParameters(mountain);
        expect(result.requiredCompletionPercent).toBe(80);
      });

      it('requires 90% completion for fatality rate 3-5% (challenging)', () => {
        const mountain = createMountain('0.04');
        const result = calculateMissionParameters(mountain);
        expect(result.requiredCompletionPercent).toBe(90);
      });

      it('requires 100% completion for fatality rate > 5% (dangerous)', () => {
        const mountain = createMountain('0.08');
        const result = calculateMissionParameters(mountain);
        expect(result.requiredCompletionPercent).toBe(100);
      });

      it('handles null fatality rate as zero', () => {
        const mountain = {
          id: 1,
          name: 'Test Peak',
          elevation: 5000,
          difficultyTier: 'intermediate',
          fatalityRate: null,
          country: 'Test',
          range: 'Test Range',
          firstAscent: 2000,
          imageUrl: null,
          climbingSeason: 'summer',
          description: 'Test'
        };

        const result = calculateMissionParameters(mountain);
        expect(result.requiredCompletionPercent).toBe(75);
      });

      it('handles undefined fatality rate as zero', () => {
        const mountain = {
          id: 1,
          name: 'Test Peak',
          elevation: 5000,
          difficultyTier: 'intermediate',
          fatalityRate: undefined,
          country: 'Test',
          range: 'Test Range',
          firstAscent: 2000,
          imageUrl: null,
          climbingSeason: 'summer',
          description: 'Test'
        };

        const result = calculateMissionParameters(mountain);
        expect(result.requiredCompletionPercent).toBe(75);
      });
    });

    describe('edge cases', () => {
      it('handles exact threshold values correctly', () => {
        const mountain1 = {
          id: 1,
          name: 'Test Peak',
          elevation: 4000,
          difficultyTier: 'intermediate',
          fatalityRate: '0.00',
          country: 'Test',
          range: 'Test Range',
          firstAscent: 2000,
          imageUrl: null,
          climbingSeason: 'summer',
          description: 'Test'
        };

        const result1 = calculateMissionParameters(mountain1);
        expect(result1.totalDays).toBe(CLIMBING.MISSION_DURATIONS.WEEK_LONG_DURATION);

        const mountain2 = {
          ...mountain1,
          elevation: 3999
        };

        const result2 = calculateMissionParameters(mountain2);
        expect(result2.totalDays).toBe(CLIMBING.MISSION_DURATIONS.SINGLE_DAY_DURATION);
      });

      it('handles fatality rate at exact threshold (1%)', () => {
        const mountain = {
          id: 1,
          name: 'Test Peak',
          elevation: 5000,
          difficultyTier: 'intermediate',
          fatalityRate: '0.01',
          country: 'Test',
          range: 'Test Range',
          firstAscent: 2000,
          imageUrl: null,
          climbingSeason: 'summer',
          description: 'Test'
        };

        const result = calculateMissionParameters(mountain);
        expect(result.requiredCompletionPercent).toBe(80);
      });

      it('rounds duration correctly', () => {
        const mountain = {
          id: 1,
          name: 'Test Peak',
          elevation: 5000,
          difficultyTier: 'novice', // 7 * 0.8 = 5.6, should round to 6
          fatalityRate: '0.00',
          country: 'Test',
          range: 'Test Range',
          firstAscent: 2000,
          imageUrl: null,
          climbingSeason: 'summer',
          description: 'Test'
        };

        const result = calculateMissionParameters(mountain);
        expect(result.totalDays).toBe(6); // Math.round(5.6)
      });
    });

    describe('real-world mountain examples', () => {
      it('calculates correctly for Mount Everest', () => {
        const everest = {
          id: 1,
          name: 'Mount Everest',
          elevation: 8849,
          difficultyTier: 'elite',
          fatalityRate: '0.04', // 4% fatality rate
          country: 'Nepal',
          range: 'Himalayas',
          firstAscent: 1953,
          imageUrl: null,
          climbingSeason: 'spring',
          description: 'Highest peak'
        };

        const result = calculateMissionParameters(everest);
        expect(result.totalDays).toBe(45); // 30 * 1.5
        expect(result.requiredCompletionPercent).toBe(90);
      });

      it('calculates correctly for K2', () => {
        const k2 = {
          id: 2,
          name: 'K2',
          elevation: 8611,
          difficultyTier: 'elite',
          fatalityRate: '0.25', // 25% fatality rate - one of the deadliest
          country: 'Pakistan',
          range: 'Karakoram',
          firstAscent: 1954,
          imageUrl: null,
          climbingSeason: 'summer',
          description: 'Savage Mountain'
        };

        const result = calculateMissionParameters(k2);
        expect(result.totalDays).toBe(45); // 30 * 1.5
        expect(result.requiredCompletionPercent).toBe(100); // Perfection required
      });

      it('calculates correctly for Kilimanjaro (easier peak)', () => {
        const kilimanjaro = {
          id: 3,
          name: 'Mount Kilimanjaro',
          elevation: 5895,
          difficultyTier: 'novice',
          fatalityRate: '0.001', // Very low fatality rate
          country: 'Tanzania',
          range: 'Kilimanjaro',
          firstAscent: 1889,
          imageUrl: null,
          climbingSeason: 'year-round',
          description: 'Highest peak in Africa'
        };

        const result = calculateMissionParameters(kilimanjaro);
        expect(result.totalDays).toBe(11); // 14 * 0.8 rounded
        expect(result.requiredCompletionPercent).toBe(75);
      });
    });
  });

  describe('calculateBaseXP', () => {
    it('returns correct XP for novice tier', () => {
      expect(calculateBaseXP('novice')).toBe(GAMIFICATION.XP_REWARDS.NOVICE);
      expect(calculateBaseXP('NOVICE')).toBe(GAMIFICATION.XP_REWARDS.NOVICE);
    });

    it('returns correct XP for intermediate tier', () => {
      expect(calculateBaseXP('intermediate')).toBe(GAMIFICATION.XP_REWARDS.INTERMEDIATE);
      expect(calculateBaseXP('INTERMEDIATE')).toBe(GAMIFICATION.XP_REWARDS.INTERMEDIATE);
    });

    it('returns correct XP for advanced tier', () => {
      expect(calculateBaseXP('advanced')).toBe(GAMIFICATION.XP_REWARDS.ADVANCED);
      expect(calculateBaseXP('ADVANCED')).toBe(GAMIFICATION.XP_REWARDS.ADVANCED);
    });

    it('returns correct XP for expert tier', () => {
      expect(calculateBaseXP('expert')).toBe(GAMIFICATION.XP_REWARDS.EXPERT);
      expect(calculateBaseXP('EXPERT')).toBe(GAMIFICATION.XP_REWARDS.EXPERT);
    });

    it('returns correct XP for elite tier', () => {
      expect(calculateBaseXP('elite')).toBe(GAMIFICATION.XP_REWARDS.ELITE);
      expect(calculateBaseXP('ELITE')).toBe(GAMIFICATION.XP_REWARDS.ELITE);
    });

    it('returns default XP for unknown tier', () => {
      expect(calculateBaseXP('unknown')).toBe(GAMIFICATION.DEFAULT_XP);
      expect(calculateBaseXP('')).toBe(GAMIFICATION.DEFAULT_XP);
    });

    it('is case-insensitive', () => {
      expect(calculateBaseXP('nOvIcE')).toBe(GAMIFICATION.XP_REWARDS.NOVICE);
      expect(calculateBaseXP('ExPeRt')).toBe(GAMIFICATION.XP_REWARDS.EXPERT);
    });
  });

  describe('calculateBasePoints', () => {
    it('returns correct points for novice tier', () => {
      expect(calculateBasePoints('novice')).toBe(GAMIFICATION.POINTS_REWARDS.NOVICE);
      expect(calculateBasePoints('NOVICE')).toBe(GAMIFICATION.POINTS_REWARDS.NOVICE);
    });

    it('returns correct points for intermediate tier', () => {
      expect(calculateBasePoints('intermediate')).toBe(GAMIFICATION.POINTS_REWARDS.INTERMEDIATE);
      expect(calculateBasePoints('INTERMEDIATE')).toBe(GAMIFICATION.POINTS_REWARDS.INTERMEDIATE);
    });

    it('returns correct points for advanced tier', () => {
      expect(calculateBasePoints('advanced')).toBe(GAMIFICATION.POINTS_REWARDS.ADVANCED);
      expect(calculateBasePoints('ADVANCED')).toBe(GAMIFICATION.POINTS_REWARDS.ADVANCED);
    });

    it('returns correct points for expert tier', () => {
      expect(calculateBasePoints('expert')).toBe(GAMIFICATION.POINTS_REWARDS.EXPERT);
      expect(calculateBasePoints('EXPERT')).toBe(GAMIFICATION.POINTS_REWARDS.EXPERT);
    });

    it('returns correct points for elite tier', () => {
      expect(calculateBasePoints('elite')).toBe(GAMIFICATION.POINTS_REWARDS.ELITE);
      expect(calculateBasePoints('ELITE')).toBe(GAMIFICATION.POINTS_REWARDS.ELITE);
    });

    it('returns default points for unknown tier', () => {
      expect(calculateBasePoints('unknown')).toBe(GAMIFICATION.DEFAULT_POINTS);
      expect(calculateBasePoints('')).toBe(GAMIFICATION.DEFAULT_POINTS);
    });

    it('is case-insensitive', () => {
      expect(calculateBasePoints('iNtErMeDiAtE')).toBe(GAMIFICATION.POINTS_REWARDS.INTERMEDIATE);
      expect(calculateBasePoints('ElItE')).toBe(GAMIFICATION.POINTS_REWARDS.ELITE);
    });
  });

  describe('XP and Points relationship', () => {
    it('maintains consistent ratio across tiers', () => {
      const tiers = ['novice', 'intermediate', 'advanced', 'expert', 'elite'];

      tiers.forEach(tier => {
        const xp = calculateBaseXP(tier);
        const points = calculateBasePoints(tier);

        // Points should be higher than XP for all tiers
        expect(points).toBeGreaterThan(xp);

        // Ratio should be reasonable (not more than 5x)
        expect(points / xp).toBeLessThan(5);
      });
    });

    it('increases rewards with difficulty', () => {
      const noviceXP = calculateBaseXP('novice');
      const intermediateXP = calculateBaseXP('intermediate');
      const advancedXP = calculateBaseXP('advanced');
      const expertXP = calculateBaseXP('expert');
      const eliteXP = calculateBaseXP('elite');

      expect(intermediateXP).toBeGreaterThan(noviceXP);
      expect(advancedXP).toBeGreaterThan(intermediateXP);
      expect(expertXP).toBeGreaterThan(advancedXP);
      expect(eliteXP).toBeGreaterThan(expertXP);

      const novicePoints = calculateBasePoints('novice');
      const intermediatePoints = calculateBasePoints('intermediate');
      const advancedPoints = calculateBasePoints('advanced');
      const expertPoints = calculateBasePoints('expert');
      const elitePoints = calculateBasePoints('elite');

      expect(intermediatePoints).toBeGreaterThan(novicePoints);
      expect(advancedPoints).toBeGreaterThan(intermediatePoints);
      expect(expertPoints).toBeGreaterThan(advancedPoints);
      expect(elitePoints).toBeGreaterThan(expertPoints);
    });
  });
});
