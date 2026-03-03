import { calculateEnergy, type EnergyInput } from '../energy';

describe('calculateEnergy', () => {
  describe('basic score calculation', () => {
    it('calculates score correctly with base metrics', () => {
      const input: EnergyInput = {
        currentSessionMinutes: 60,
        sessionsToday: 2,
        skippedBreaksToday: 1,
        funengineOpensToday: 1,
        streak: 0,
        hourOfDay: 10,
      };

      const result = calculateEnergy(input);

      // (60/60)*0.4 + 2*0.3 + 1*0.2 + 1*0.1 = 0.4 + 0.6 + 0.2 + 0.1 = 1.3
      expect(result.score).toBeCloseTo(1.3, 1);
      expect(result.level).toBe('low');
    });

    it('returns low level for score < 2', () => {
      const input: EnergyInput = {
        currentSessionMinutes: 30,
        sessionsToday: 1,
        skippedBreaksToday: 0,
        funengineOpensToday: 0,
        streak: 0,
        hourOfDay: 10,
      };

      const result = calculateEnergy(input);
      expect(result.level).toBe('low');
    });

    it('returns mid level for score 2-4', () => {
      const input: EnergyInput = {
        currentSessionMinutes: 180,
        sessionsToday: 3,
        skippedBreaksToday: 2,
        funengineOpensToday: 1,
        streak: 0,
        hourOfDay: 10,
      };

      const result = calculateEnergy(input);
      // (180/60)*0.4 + 3*0.3 + 2*0.2 + 1*0.1 = 1.2 + 0.9 + 0.4 + 0.1 = 2.6
      expect(result.score).toBeCloseTo(2.6, 1);
      expect(result.level).toBe('mid');
    });

    it('returns high level for score 4-6', () => {
      const input: EnergyInput = {
        currentSessionMinutes: 300,
        sessionsToday: 5,
        skippedBreaksToday: 3,
        funengineOpensToday: 2,
        streak: 0,
        hourOfDay: 10,
      };

      const result = calculateEnergy(input);
      // (300/60)*0.4 + 5*0.3 + 3*0.2 + 2*0.1 = 2.0 + 1.5 + 0.6 + 0.2 = 4.3
      expect(result.score).toBeCloseTo(4.3, 1);
      expect(result.level).toBe('high');
    });

    it('returns chaos level for score >= 6', () => {
      const input: EnergyInput = {
        currentSessionMinutes: 600,
        sessionsToday: 8,
        skippedBreaksToday: 5,
        funengineOpensToday: 3,
        streak: 0,
        hourOfDay: 10,
      };

      const result = calculateEnergy(input);
      // (600/60)*0.4 + 8*0.3 + 5*0.2 + 3*0.1 = 4.0 + 2.4 + 1.0 + 0.3 = 7.7
      expect(result.score).toBeCloseTo(7.7, 1);
      expect(result.level).toBe('chaos');
    });
  });

  describe('adjustments', () => {
    it('adds 1 point for late hour (>= 22)', () => {
      const baseInput: EnergyInput = {
        currentSessionMinutes: 60,
        sessionsToday: 1,
        skippedBreaksToday: 0,
        funengineOpensToday: 0,
        streak: 0,
        hourOfDay: 10,
      };

      const lateInput: EnergyInput = { ...baseInput, hourOfDay: 22 };

      const baseResult = calculateEnergy(baseInput);
      const lateResult = calculateEnergy(lateInput);

      expect(lateResult.score).toBeCloseTo(baseResult.score + 1, 1);
    });

    it('adds 0.5 point for streak > 7', () => {
      const baseInput: EnergyInput = {
        currentSessionMinutes: 60,
        sessionsToday: 1,
        skippedBreaksToday: 0,
        funengineOpensToday: 0,
        streak: 5,
        hourOfDay: 10,
      };

      const streakInput: EnergyInput = { ...baseInput, streak: 8 };

      const baseResult = calculateEnergy(baseInput);
      const streakResult = calculateEnergy(streakInput);

      expect(streakResult.score).toBeCloseTo(baseResult.score + 0.5, 1);
    });

    it('adds 0.5 point for average session > 90 minutes', () => {
      const input: EnergyInput = {
        currentSessionMinutes: 200,
        sessionsToday: 2,
        skippedBreaksToday: 0,
        funengineOpensToday: 0,
        streak: 0,
        hourOfDay: 10,
      };

      const result = calculateEnergy(input);
      // Average = 200/2 = 100 minutes > 90, so +0.5
      // Base: (200/60)*0.4 + 2*0.3 = 1.33 + 0.6 = 1.93
      // With adjustment: 1.93 + 0.5 = 2.43
      expect(result.score).toBeCloseTo(2.43, 1);
    });

    it('combines all adjustments correctly', () => {
      const input: EnergyInput = {
        currentSessionMinutes: 200,
        sessionsToday: 2,
        skippedBreaksToday: 1,
        funengineOpensToday: 0,
        streak: 10,
        hourOfDay: 23,
      };

      const result = calculateEnergy(input);
      // Base: (200/60)*0.4 + 2*0.3 + 1*0.2 = 1.33 + 0.6 + 0.2 = 2.13
      // Late hour: +1
      // Streak > 7: +0.5
      // Avg session (200/2=100 > 90): +0.5
      // Total: 2.13 + 1 + 0.5 + 0.5 = 4.13
      expect(result.score).toBeCloseTo(4.13, 1);
      expect(result.level).toBe('high');
    });
  });

  describe('edge cases', () => {
    it('handles zero values', () => {
      const input: EnergyInput = {
        currentSessionMinutes: 0,
        sessionsToday: 0,
        skippedBreaksToday: 0,
        funengineOpensToday: 0,
        streak: 0,
        hourOfDay: 10,
      };

      const result = calculateEnergy(input);
      expect(result.score).toBe(0);
      expect(result.level).toBe('low');
    });

    it('handles very large values', () => {
      const input: EnergyInput = {
        currentSessionMinutes: 10000,
        sessionsToday: 50,
        skippedBreaksToday: 20,
        funengineOpensToday: 10,
        streak: 100,
        hourOfDay: 23,
      };

      const result = calculateEnergy(input);
      expect(result.level).toBe('chaos');
      expect(result.score).toBeGreaterThan(6);
    });

    it('is deterministic with same input', () => {
      const input: EnergyInput = {
        currentSessionMinutes: 120,
        sessionsToday: 3,
        skippedBreaksToday: 1,
        funengineOpensToday: 1,
        streak: 5,
        hourOfDay: 14,
      };

      const result1 = calculateEnergy(input);
      const result2 = calculateEnergy(input);

      expect(result1.score).toBe(result2.score);
      expect(result1.level).toBe(result2.level);
    });
  });
});
