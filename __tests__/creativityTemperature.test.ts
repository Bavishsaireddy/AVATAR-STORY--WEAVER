import { describe, it, expect, vi } from "vitest";
import { 
  preferenceRailPercent, 
  storyApiTemperature, 
  choicesApiTemperature, 
  withPerCallJitter,
  CREATIVITY_PRESET_TEMPERATURE
} from "../src/lib/creativityTemperature";

describe("creativityTemperature utilities", () => {
  
  describe("preferenceRailPercent", () => {
    it("maps precise (0.2) to 11 percent", () => {
      // (0.2 - 0.1) / 0.9 * 100 = 11.11 -> 11
      expect(preferenceRailPercent("precise")).toBe(11);
    });

    it("maps chaotic (0.95) to 94 percent", () => {
      // (0.95 - 0.1) / 0.9 * 100 = 94.44 -> 94
      expect(preferenceRailPercent("chaotic")).toBe(94);
    });
  });

  describe("storyApiTemperature", () => {
    it("returns standard preset for normal modes", () => {
      expect(storyApiTemperature("creative", "continue")).toBe(CREATIVITY_PRESET_TEMPERATURE["creative"]);
    });

    it("caps the temperature at 0.7 when mode is 'conclude' to prevent chaotic endings", () => {
      expect(storyApiTemperature("chaotic", "conclude")).toBe(0.7);
    });
  });

  describe("choicesApiTemperature", () => {
    it("bumps the requested temperature by 0.1 to allow diverse branches", () => {
      expect(choicesApiTemperature("balanced")).toBe(CREATIVITY_PRESET_TEMPERATURE["balanced"] + 0.1);
    });

    it("clamps at 1.0 so we never send invalid temperatures to the LLM API", () => {
      // chaotic is 0.95. Bumped is 1.05. It should clamp to 1.0
      expect(choicesApiTemperature("chaotic")).toBe(1.0);
    });
  });

  describe("withPerCallJitter", () => {
    it("returns exact base if vary is explicitly disabled", () => {
      expect(withPerCallJitter(0.5, false)).toBe(0.5);
    });

    it("jitters within ±0.22 bounds", () => {
      // Since Math.random is used, we'll mock it or run it multiple times to ensure strict bounds
      const base = 0.50;
      for (let i = 0; i < 50; i++) {
        const temp = withPerCallJitter(base, true);
        expect(temp).toBeGreaterThanOrEqual(0.28); // 0.50 - 0.22
        expect(temp).toBeLessThanOrEqual(0.72);    // 0.50 + 0.22
      }
    });

    it("strictly clamps the jitter bounds at 0.1 minimum", () => {
      // A base of 0.2 - 0.22 = -0.02, clamped to 0.10
      for (let i = 0; i < 50; i++) {
        const temp = withPerCallJitter(0.2, true);
        expect(temp).toBeGreaterThanOrEqual(0.10);
      }
    });

    it("strictly clamps the jitter bounds at 1.0 maximum", () => {
      // A base of 0.95 + 0.22 = 1.17, clamped to 1.0
      for (let i = 0; i < 50; i++) {
        const temp = withPerCallJitter(0.95, true);
        expect(temp).toBeLessThanOrEqual(1.0);
      }
    });
  });
});
