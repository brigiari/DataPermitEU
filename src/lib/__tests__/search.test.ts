import { describe, expect, it } from "vitest";
import { DATASETS } from "@/lib/data/datasets";
import {
  activeFilterCount,
  EMPTY_FILTERS,
  facetCounts,
  filterDatasets,
  textScore,
} from "@/lib/search";
import { COUNTRIES, DISEASE_AREAS } from "@/lib/types";

describe("filterDatasets", () => {
  it("returns the whole catalogue with no filters applied", () => {
    expect(filterDatasets(DATASETS, EMPTY_FILTERS)).toHaveLength(DATASETS.length);
  });

  it("sorts alphabetically when there is no query", () => {
    const names = filterDatasets(DATASETS, EMPTY_FILTERS).map((dataset) => dataset.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });

  it("filters by country", () => {
    const results = filterDatasets(DATASETS, { ...EMPTY_FILTERS, countries: ["Sweden"] });
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((dataset) => dataset.country === "Sweden")).toBe(true);
  });

  it("treats multiple values within one facet as OR", () => {
    const results = filterDatasets(DATASETS, {
      ...EMPTY_FILTERS,
      countries: ["Sweden", "Finland"],
    });
    expect(new Set(results.map((dataset) => dataset.country))).toEqual(new Set(["Sweden", "Finland"]));
  });

  it("treats separate facets as AND", () => {
    const results = filterDatasets(DATASETS, {
      ...EMPTY_FILTERS,
      countries: ["Sweden"],
      dataCategories: ["Prescription & dispensing"],
    });
    expect(results.map((dataset) => dataset.id)).toEqual(["spdr-se"]);
  });

  it("excludes datasets whose coverage ends before the requested start year", () => {
    const results = filterDatasets(DATASETS, { ...EMPTY_FILTERS, coverageFrom: 2025 });
    // VHDA is a closed archive ending in 2024 and must not appear.
    expect(results.some((dataset) => dataset.id === "vhda-pl")).toBe(false);
  });

  it("excludes datasets that start after the requested end year", () => {
    const results = filterDatasets(DATASETS, { ...EMPTY_FILTERS, coverageTo: 1995 });
    expect(results.every((dataset) => dataset.timeCoverage.start <= 1995)).toBe(true);
  });

  it("applies quality floors", () => {
    const results = filterDatasets(DATASETS, { ...EMPTY_FILTERS, minInteroperability: 90 });
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((dataset) => dataset.quality.interoperability >= 90)).toBe(true);
    expect(results.some((dataset) => dataset.id === "vhda-pl")).toBe(false);
  });

  it("applies a minimum cohort size", () => {
    const results = filterDatasets(DATASETS, { ...EMPTY_FILTERS, minCohortSize: 5_000_000 });
    expect(results.every((dataset) => dataset.approximateCohortSize >= 5_000_000)).toBe(true);
  });

  it("ranks an exact acronym match first", () => {
    const results = filterDatasets(DATASETS, { ...EMPTY_FILTERS, query: "SCOR" });
    expect(results[0].id).toBe("scor-se");
  });

  it("finds datasets by variable-level terms", () => {
    const results = filterDatasets(DATASETS, { ...EMPTY_FILTERS, query: "ejection fraction" });
    expect(results.map((dataset) => dataset.id)).toContain("scor-se");
  });

  it("returns nothing for a query that matches no dataset", () => {
    expect(filterDatasets(DATASETS, { ...EMPTY_FILTERS, query: "zzzqqqxx" })).toHaveLength(0);
  });

  it("is deterministic across repeated calls", () => {
    const filters = { ...EMPTY_FILTERS, query: "adherence readmission" };
    expect(filterDatasets(DATASETS, filters).map((d) => d.id)).toEqual(
      filterDatasets(DATASETS, filters).map((d) => d.id),
    );
  });
});

describe("textScore", () => {
  it("returns zero for an empty query", () => {
    expect(textScore(DATASETS[0], "   ")).toBe(0);
  });

  it("scores a dataset higher on its own disease area than an unrelated one", () => {
    const cardio = DATASETS.find((dataset) => dataset.id === "scor-se")!;
    const oncology = DATASETS.find((dataset) => dataset.id === "rror-de")!;
    expect(textScore(cardio, "cardiovascular readmission")).toBeGreaterThan(
      textScore(oncology, "cardiovascular readmission"),
    );
  });
});

describe("facetCounts", () => {
  it("computes counts against all other facets, not the facet being counted", () => {
    const filters = { ...EMPTY_FILTERS, countries: ["Sweden"] as (typeof COUNTRIES)[number][] };
    const counts = facetCounts(DATASETS, filters, "countries", COUNTRIES, (dataset) => [
      dataset.country,
    ]);
    // Because the country facet is excluded from its own count, other countries
    // still show their real totals rather than zero.
    expect(counts.Finland).toBeGreaterThan(0);
    expect(counts.Sweden).toBeGreaterThan(0);
  });

  it("narrows counts when a different facet is active", () => {
    const unfiltered = facetCounts(DATASETS, EMPTY_FILTERS, "diseaseAreas", DISEASE_AREAS, (d) => d.diseaseAreas);
    const filtered = facetCounts(
      DATASETS,
      { ...EMPTY_FILTERS, countries: ["Sweden"] },
      "diseaseAreas",
      DISEASE_AREAS,
      (d) => d.diseaseAreas,
    );
    expect(filtered.Oncology).toBeLessThan(unfiltered.Oncology);
  });
});

describe("activeFilterCount", () => {
  it("counts nothing for empty filters", () => {
    expect(activeFilterCount(EMPTY_FILTERS)).toBe(0);
  });

  it("counts each selected value and each numeric bound", () => {
    expect(
      activeFilterCount({
        ...EMPTY_FILTERS,
        query: "heart",
        countries: ["Sweden", "Finland"],
        minCompleteness: 80,
      }),
    ).toBe(4);
  });
});
