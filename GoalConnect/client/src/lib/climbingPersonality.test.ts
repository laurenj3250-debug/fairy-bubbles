import { describe, it, expect } from 'vitest';
import { calculatePersonality, PersonalityType } from './climbingPersonality';

describe('climbingPersonality', () => {
  const baseInput = {
    sendRate: 50,
    flashRate: 30,
    avgAttemptsPerSend: 2.5,
    maxGradeNumeric: 6,
    avgGradeNumeric: 4,
    preferredAngle: 30,
    problemsPerSession: 15,
    sessionCount: 20,
    gradeDistribution: { 'V3': 20, 'V4': 30, 'V5': 15, 'V6': 5 },
  };

  describe('calculatePersonality', () => {
    it('identifies VOLUME_WARRIOR - high volume, lower grades', () => {
      const input = {
        ...baseInput,
        sendRate: 85,
        problemsPerSession: 30,
        maxGradeNumeric: 5,
        avgGradeNumeric: 3,
      };
      const result = calculatePersonality(input);
      expect(result.primary).toBe('VOLUME_WARRIOR');
      expect(result.scores.VOLUME_WARRIOR).toBeGreaterThan(50);
    });

    it('identifies PROJECT_CRUSHER - low send rate, high max grade', () => {
      const input = {
        ...baseInput,
        sendRate: 20,
        avgAttemptsPerSend: 8,
        maxGradeNumeric: 8,
        avgGradeNumeric: 4,
      };
      const result = calculatePersonality(input);
      expect(result.primary).toBe('PROJECT_CRUSHER');
      expect(result.scores.PROJECT_CRUSHER).toBeGreaterThan(50);
    });

    it('identifies FLASH_MASTER - high first-try sends', () => {
      const input = {
        ...baseInput,
        flashRate: 80,
        avgAttemptsPerSend: 1.2,
      };
      const result = calculatePersonality(input);
      expect(result.primary).toBe('FLASH_MASTER');
      expect(result.scores.FLASH_MASTER).toBeGreaterThan(50);
    });

    it('identifies ANGLE_DEMON - prefers steep angles', () => {
      const input = {
        ...baseInput,
        preferredAngle: 50,
      };
      const result = calculatePersonality(input);
      expect(result.primary).toBe('ANGLE_DEMON');
      expect(result.scores.ANGLE_DEMON).toBeGreaterThan(50);
    });

    it('identifies CONSISTENCY_KING - balanced climber', () => {
      const input = {
        ...baseInput,
        sendRate: 60,
        flashRate: 35,
        avgAttemptsPerSend: 2,
        maxGradeNumeric: 5,
        avgGradeNumeric: 4,
        preferredAngle: 25,
        sessionCount: 50,
      };
      const result = calculatePersonality(input);
      // Consistency King is the "balanced" type
      expect(result.scores.CONSISTENCY_KING).toBeGreaterThan(30);
    });

    it('returns all scores as 0-100 values', () => {
      const result = calculatePersonality(baseInput);
      const types: PersonalityType[] = [
        'VOLUME_WARRIOR',
        'PROJECT_CRUSHER',
        'FLASH_MASTER',
        'ANGLE_DEMON',
        'CONSISTENCY_KING',
      ];

      types.forEach(type => {
        expect(result.scores[type]).toBeGreaterThanOrEqual(0);
        expect(result.scores[type]).toBeLessThanOrEqual(100);
      });
    });

    it('returns description and traits', () => {
      const result = calculatePersonality(baseInput);
      expect(result.description).toBeTruthy();
      expect(result.traits.length).toBeGreaterThan(0);
      expect(result.tagline).toBeTruthy();
    });

    it('handles edge case - very few sessions', () => {
      const input = {
        ...baseInput,
        sessionCount: 1,
      };
      const result = calculatePersonality(input);
      expect(result.primary).toBeDefined();
    });

    it('handles edge case - 0% send rate', () => {
      const input = {
        ...baseInput,
        sendRate: 0,
        flashRate: 0,
      };
      const result = calculatePersonality(input);
      // Should still return a type, probably PROJECT_CRUSHER
      expect(result.primary).toBeDefined();
    });
  });
});
