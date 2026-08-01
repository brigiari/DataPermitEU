import { describe, expect, it } from "vitest";
import { clamp01, containsAny, overlapCount, overlapTerms, slug, tokenize, wordCount } from "@/lib/text";

describe("tokenize", () => {
  it("lower-cases, strips punctuation and drops stopwords", () => {
    expect(tokenize("The Study of Cardiovascular Readmission!")).toEqual([
      "cardiovascular",
      "readmission",
    ]);
  });

  it("drops tokens of two characters or fewer", () => {
    expect(tokenize("an ax by heart")).toEqual(["heart"]);
  });

  it("singularises plurals so that a query matches a singular description", () => {
    expect(tokenize("prescriptions therapies cases")).toEqual([
      "prescription",
      "therapy",
      "case",
    ]);
  });

  it("handles Greek-derived plurals so 'diagnoses' matches 'diagnosis'", () => {
    expect(tokenize("diagnoses")).toEqual(tokenize("diagnosis"));
    expect(tokenize("prognoses")).toEqual(["prognosis"]);
  });

  it("reduces sibilant plurals without truncating the stem", () => {
    expect(tokenize("addresses")).toEqual(["address"]);
  });

  it("leaves double-s words alone", () => {
    expect(tokenize("access illness")).toEqual(["access", "illness"]);
  });
});

describe("overlapCount and overlapTerms", () => {
  it("counts shared content words only", () => {
    const query = new Set(tokenize("medication adherence and readmission"));
    expect(overlapCount(query, "Adherence to medication after discharge")).toBe(2);
  });

  it("returns shared terms in a stable sorted order", () => {
    const query = new Set(tokenize("readmission adherence medication"));
    expect(overlapTerms(query, "medication adherence readmission")).toEqual([
      "adherence",
      "medication",
      "readmission",
    ]);
  });

  it("returns zero when nothing overlaps", () => {
    const query = new Set(tokenize("oncology staging"));
    expect(overlapCount(query, "dispensing and pharmacy records")).toBe(0);
  });
});

describe("containsAny", () => {
  it("matches case-insensitively and returns every hit", () => {
    expect(containsAny("We will use INSURANCE data for Marketing", ["insurance", "marketing"])).toEqual([
      "insurance",
      "marketing",
    ]);
  });

  it("returns an empty array when nothing matches", () => {
    expect(containsAny("a clean purpose statement", ["insurance"])).toEqual([]);
  });
});

describe("wordCount", () => {
  it("counts words and ignores surrounding whitespace", () => {
    expect(wordCount("  three little  words ")).toBe(3);
  });

  it("returns zero for empty input", () => {
    expect(wordCount("   ")).toBe(0);
  });
});

describe("clamp01", () => {
  it("bounds values to the unit interval", () => {
    expect(clamp01(-2)).toBe(0);
    expect(clamp01(0.42)).toBe(0.42);
    expect(clamp01(7)).toBe(1);
  });
});

describe("slug", () => {
  it("builds a stable lower-case slug and drops empty parts", () => {
    expect(slug("MIN-01", undefined, "Household Income!")).toBe("min-01-household-income");
  });
});
