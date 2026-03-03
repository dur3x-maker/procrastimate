import {
  incrementFunEngineOpens,
  incrementResistedDistractions,
  incrementSkippedBreaks,
  getFunEngineOpensToday,
  getResistedDistractionsToday,
  getSkippedBreaksToday,
} from '../dailyCounters';

describe('dailyCounters', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('incrementFunEngineOpens', () => {
    it('increments from 0 to 1', () => {
      incrementFunEngineOpens();
      expect(getFunEngineOpensToday()).toBe(1);
    });

    it('increments multiple times', () => {
      incrementFunEngineOpens();
      incrementFunEngineOpens();
      incrementFunEngineOpens();
      expect(getFunEngineOpensToday()).toBe(3);
    });

    it('handles existing value', () => {
      localStorage.setItem('pm_funengineOpensToday', '5');
      incrementFunEngineOpens();
      expect(getFunEngineOpensToday()).toBe(6);
    });
  });

  describe('incrementResistedDistractions', () => {
    it('increments from 0 to 1', () => {
      incrementResistedDistractions();
      expect(getResistedDistractionsToday()).toBe(1);
    });

    it('increments multiple times', () => {
      incrementResistedDistractions();
      incrementResistedDistractions();
      expect(getResistedDistractionsToday()).toBe(2);
    });

    it('handles existing value', () => {
      localStorage.setItem('pm_resistedDistractionsToday', '10');
      incrementResistedDistractions();
      expect(getResistedDistractionsToday()).toBe(11);
    });
  });

  describe('incrementSkippedBreaks', () => {
    it('increments from 0 to 1', () => {
      incrementSkippedBreaks();
      expect(getSkippedBreaksToday()).toBe(1);
    });

    it('increments multiple times', () => {
      incrementSkippedBreaks();
      incrementSkippedBreaks();
      incrementSkippedBreaks();
      expect(getSkippedBreaksToday()).toBe(3);
    });

    it('handles existing value', () => {
      localStorage.setItem('pm_skippedBreaksToday', '7');
      incrementSkippedBreaks();
      expect(getSkippedBreaksToday()).toBe(8);
    });
  });

  describe('get functions', () => {
    it('returns 0 for empty localStorage', () => {
      expect(getFunEngineOpensToday()).toBe(0);
      expect(getResistedDistractionsToday()).toBe(0);
      expect(getSkippedBreaksToday()).toBe(0);
    });

    it('returns correct values from localStorage', () => {
      localStorage.setItem('pm_funengineOpensToday', '5');
      localStorage.setItem('pm_resistedDistractionsToday', '3');
      localStorage.setItem('pm_skippedBreaksToday', '2');

      expect(getFunEngineOpensToday()).toBe(5);
      expect(getResistedDistractionsToday()).toBe(3);
      expect(getSkippedBreaksToday()).toBe(2);
    });

    it('handles invalid localStorage values', () => {
      localStorage.setItem('pm_funengineOpensToday', 'invalid');
      localStorage.setItem('pm_resistedDistractionsToday', '');
      localStorage.setItem('pm_skippedBreaksToday', 'NaN');

      expect(getFunEngineOpensToday()).toBe(0);
      expect(getResistedDistractionsToday()).toBe(0);
      expect(getSkippedBreaksToday()).toBe(0);
    });
  });

  describe('deterministic behavior', () => {
    it('produces consistent results', () => {
      incrementFunEngineOpens();
      const value1 = getFunEngineOpensToday();
      const value2 = getFunEngineOpensToday();
      expect(value1).toBe(value2);
    });

    it('counters are independent', () => {
      incrementFunEngineOpens();
      incrementResistedDistractions();
      incrementSkippedBreaks();

      expect(getFunEngineOpensToday()).toBe(1);
      expect(getResistedDistractionsToday()).toBe(1);
      expect(getSkippedBreaksToday()).toBe(1);
    });
  });
});
