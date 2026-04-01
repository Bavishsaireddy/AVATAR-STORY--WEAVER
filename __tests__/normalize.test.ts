import { describe, it, expect } from "vitest";
import { normalizeDna, normalizeCharacters } from "../src/lib/normalize";
import type { StoryDNA, Character } from "../src/types/story";

describe("normalizeDna", () => {
  const fallback: StoryDNA = {
    mysteries: ["Who is the killer?"],
    worldRules: ["Gravity is inverted"],
    tensionLevel: 5,
    tensionDescription: "Moderate tension",
    runningSummary: "The story began.",
  };

  it("returns fallback when input is undefined or null", () => {
    expect(normalizeDna(undefined, fallback)).toEqual(fallback);
    expect(normalizeDna(null as any, fallback)).toEqual(fallback);
  });

  it("handles perfectly formed DNA", () => {
    const valid = {
      mysteries: ["Secret 1"],
      worldRules: ["Rule 1"],
      tensionLevel: 8,
      tensionDescription: "High action",
      runningSummary: "Something happened.",
    };
    expect(normalizeDna(valid, fallback)).toEqual(valid);
  });

  it("falls back to default arrays if LLM omits mysteries or worldRules", () => {
    const broken = {
      tensionLevel: 9,
      tensionDescription: "Peak",
      runningSummary: "Summary",
      // omitting mysteries and worldRules entirely
    };
    
    const result = normalizeDna(broken, fallback);
    expect(result?.mysteries).toEqual(fallback.mysteries);
    expect(result?.worldRules).toEqual(fallback.worldRules);
    expect(result?.tensionLevel).toBe(9);
  });

  it("bounds tensionLevel strictly between 1 and 10", () => {
    expect(normalizeDna({ tensionLevel: 15 }, fallback)?.tensionLevel).toBe(10);
    expect(normalizeDna({ tensionLevel: -5 }, fallback)?.tensionLevel).toBe(1);
    expect(normalizeDna({ tensionLevel: 4.6 }, fallback)?.tensionLevel).toBe(5); // Testing round
  });

  it("falls back tensionLevel if LLM returns a string instead of number", () => {
    // @ts-expect-error testing bad runtime data
    expect(normalizeDna({ tensionLevel: "High" }, fallback)?.tensionLevel).toBe(fallback.tensionLevel);
  });
});

describe("normalizeCharacters", () => {
  const fallback: Character[] = [{ name: "Alice", description: "The brave leader." }];

  it("returns fallback if input is not an array", () => {
    expect(normalizeCharacters({}, fallback)).toEqual(fallback);
    expect(normalizeCharacters(null, fallback)).toEqual(fallback);
  });

  it("filters out invalid character objects", () => {
    const raw = [
      { name: "Bob", description: "The builder" },
      { name: "", description: "No name" }, // Invalid, missing actual name
      { justRandomKey: "Oops" }, // Invalid shape
      "Not an object", // Invalid type
      { name: "Charlie", description: "The cook" }
    ];

    const result = normalizeCharacters(raw, fallback);
    expect(result.length).toBe(2);
    expect(result[0].name).toBe("Bob");
    expect(result[1].name).toBe("Charlie");
  });

  it("strips whitespace from names and descriptions", () => {
    const raw = [{ name: "  Dave  ", description: "   A bit messy.   " }];
    const result = normalizeCharacters(raw, fallback);
    expect(result[0].name).toBe("Dave");
    expect(result[0].description).toBe("A bit messy.");
  });

  it("returns fallback if array is empty after filtering", () => {
    const raw = [{ badShape: true }];
    expect(normalizeCharacters(raw, fallback)).toEqual(fallback);
  });
});
