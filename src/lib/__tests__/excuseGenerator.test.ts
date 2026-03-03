import {
  getRandomExcuses,
  clearExcuseHistory,
  mapEnergyToAbsurdLevel,
  type Excuse,
} from "../excuseGenerator";

describe("excuseGenerator", () => {
  beforeEach(() => {
    clearExcuseHistory();
  });

  describe("getRandomExcuses", () => {
    it("should return 2 excuses by default", () => {
      const excuses = getRandomExcuses({ locale: "en" });
      expect(excuses).toHaveLength(2);
    });

    it("should return excuses for ru locale", () => {
      const excuses = getRandomExcuses({ locale: "ru" });
      expect(excuses).toHaveLength(2);
      expect(excuses[0]).toHaveProperty("text");
      expect(excuses[0]).toHaveProperty("absurdLevel");
      expect(excuses[0]).toHaveProperty("surrealLevel");
    });

    it("should return excuses for en locale", () => {
      const excuses = getRandomExcuses({ locale: "en" });
      expect(excuses).toHaveLength(2);
      expect(excuses[0]).toHaveProperty("text");
      expect(excuses[0]).toHaveProperty("absurdLevel");
      expect(excuses[0]).toHaveProperty("surrealLevel");
    });

    it("should respect custom count", () => {
      const excuses = getRandomExcuses({ locale: "en", count: 5 });
      expect(excuses).toHaveLength(5);
    });

    it("should filter by minAbsurdLevel", () => {
      const excuses = getRandomExcuses({
        locale: "en",
        count: 10,
        minAbsurdLevel: 8,
      });
      excuses.forEach((excuse) => {
        expect(excuse.absurdLevel).toBeGreaterThanOrEqual(8);
      });
    });

    it("should filter by maxAbsurdLevel", () => {
      const excuses = getRandomExcuses({
        locale: "en",
        count: 10,
        maxAbsurdLevel: 3,
      });
      excuses.forEach((excuse) => {
        expect(excuse.absurdLevel).toBeLessThanOrEqual(3);
      });
    });

    it("should filter by absurdLevel range", () => {
      const excuses = getRandomExcuses({
        locale: "en",
        count: 10,
        minAbsurdLevel: 4,
        maxAbsurdLevel: 6,
      });
      excuses.forEach((excuse) => {
        expect(excuse.absurdLevel).toBeGreaterThanOrEqual(4);
        expect(excuse.absurdLevel).toBeLessThanOrEqual(6);
      });
    });

    it("should filter by surrealLevel", () => {
      const excuses = getRandomExcuses({
        locale: "en",
        count: 10,
        minSurrealLevel: 5,
      });
      excuses.forEach((excuse) => {
        expect(excuse.surrealLevel).toBeGreaterThanOrEqual(5);
      });
    });

    it("should avoid repeating recent excuses", () => {
      const firstBatch = getRandomExcuses({ locale: "en", count: 2 });
      const secondBatch = getRandomExcuses({ locale: "en", count: 2 });
      const thirdBatch = getRandomExcuses({ locale: "en", count: 2 });

      const allTexts = [
        ...firstBatch.map((e) => e.text),
        ...secondBatch.map((e) => e.text),
        ...thirdBatch.map((e) => e.text),
      ];

      const uniqueTexts = new Set(allTexts);
      expect(uniqueTexts.size).toBeGreaterThan(2);
    });

    it("should handle empty filter results gracefully", () => {
      const excuses = getRandomExcuses({
        locale: "en",
        count: 2,
        minAbsurdLevel: 100,
      });
      expect(excuses).toEqual([]);
    });

    it("should fallback to en for unknown locale", () => {
      const excuses = getRandomExcuses({ locale: "fr", count: 2 });
      expect(excuses).toHaveLength(2);
    });
  });

  describe("clearExcuseHistory", () => {
    it("should clear history and allow repeats", () => {
      const firstBatch = getRandomExcuses({ locale: "en", count: 2 });
      clearExcuseHistory();
      const secondBatch = getRandomExcuses({ locale: "en", count: 2 });

      expect(firstBatch).toHaveLength(2);
      expect(secondBatch).toHaveLength(2);
    });
  });

  describe("mapEnergyToAbsurdLevel", () => {
    it("should map low energy to absurdLevel 1-3", () => {
      const result = mapEnergyToAbsurdLevel("low");
      expect(result).toEqual({ minAbsurdLevel: 1, maxAbsurdLevel: 3 });
    });

    it("should map medium energy to absurdLevel 3-6", () => {
      const result = mapEnergyToAbsurdLevel("medium");
      expect(result).toEqual({ minAbsurdLevel: 3, maxAbsurdLevel: 6 });
    });

    it("should map high energy to absurdLevel 6-8", () => {
      const result = mapEnergyToAbsurdLevel("high");
      expect(result).toEqual({ minAbsurdLevel: 6, maxAbsurdLevel: 8 });
    });

    it("should map chaos energy to absurdLevel 8-10", () => {
      const result = mapEnergyToAbsurdLevel("chaos");
      expect(result).toEqual({ minAbsurdLevel: 8, maxAbsurdLevel: 10 });
    });

    it("should return empty object for unknown energy", () => {
      const result = mapEnergyToAbsurdLevel("unknown");
      expect(result).toEqual({});
    });
  });

  describe("excuse structure validation", () => {
    it("should have valid structure for ru excuses", () => {
      const excuses = getRandomExcuses({ locale: "ru", count: 5 });
      excuses.forEach((excuse) => {
        expect(typeof excuse.text).toBe("string");
        expect(excuse.text.length).toBeGreaterThan(0);
        expect(typeof excuse.absurdLevel).toBe("number");
        expect(excuse.absurdLevel).toBeGreaterThanOrEqual(1);
        expect(excuse.absurdLevel).toBeLessThanOrEqual(10);
        expect(typeof excuse.surrealLevel).toBe("number");
        expect(excuse.surrealLevel).toBeGreaterThanOrEqual(1);
        expect(excuse.surrealLevel).toBeLessThanOrEqual(10);
      });
    });

    it("should have valid structure for en excuses", () => {
      const excuses = getRandomExcuses({ locale: "en", count: 5 });
      excuses.forEach((excuse) => {
        expect(typeof excuse.text).toBe("string");
        expect(excuse.text.length).toBeGreaterThan(0);
        expect(typeof excuse.absurdLevel).toBe("number");
        expect(excuse.absurdLevel).toBeGreaterThanOrEqual(1);
        expect(excuse.absurdLevel).toBeLessThanOrEqual(10);
        expect(typeof excuse.surrealLevel).toBe("number");
        expect(excuse.surrealLevel).toBeGreaterThanOrEqual(1);
        expect(excuse.surrealLevel).toBeLessThanOrEqual(10);
      });
    });
  });

  describe("history management", () => {
    it("should maintain history size limit", () => {
      for (let i = 0; i < 20; i++) {
        getRandomExcuses({ locale: "en", count: 1 });
      }

      const excuses = getRandomExcuses({ locale: "en", count: 2 });
      expect(excuses).toHaveLength(2);
    });

    it("should eventually repeat after history is full", () => {
      const allExcuses: string[] = [];
      
      for (let i = 0; i < 50; i++) {
        const batch = getRandomExcuses({ locale: "en", count: 1 });
        allExcuses.push(batch[0].text);
      }

      const uniqueCount = new Set(allExcuses).size;
      expect(uniqueCount).toBeLessThan(allExcuses.length);
    });
  });
});
