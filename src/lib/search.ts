import type {
  AccessComplexity,
  CodingSystem,
  Country,
  DataCategory,
  Dataset,
  DiseaseArea,
  LinkageStatus,
  Population,
  UpdateFrequency,
} from "@/lib/types";
import { overlapCount, tokenSet } from "@/lib/text";

export interface CatalogueFilters {
  query: string;
  countries: Country[];
  diseaseAreas: DiseaseArea[];
  dataCategories: DataCategory[];
  populations: Population[];
  updateFrequencies: UpdateFrequency[];
  codingSystems: CodingSystem[];
  accessBodies: string[];
  accessComplexities: AccessComplexity[];
  linkageStatuses: LinkageStatus[];
  /** Inclusive year bounds the dataset must cover some part of. */
  coverageFrom: number | null;
  coverageTo: number | null;
  /** Minimum approximate cohort size. */
  minCohortSize: number | null;
  /** Minimum value for each quality indicator, 0–100. */
  minCompleteness: number | null;
  minInteroperability: number | null;
  minTimeliness: number | null;
}

export const EMPTY_FILTERS: CatalogueFilters = {
  query: "",
  countries: [],
  diseaseAreas: [],
  dataCategories: [],
  populations: [],
  updateFrequencies: [],
  codingSystems: [],
  accessBodies: [],
  accessComplexities: [],
  linkageStatuses: [],
  coverageFrom: null,
  coverageTo: null,
  minCohortSize: null,
  minCompleteness: null,
  minInteroperability: null,
  minTimeliness: null,
};

function coverageEnd(dataset: Dataset): number {
  return dataset.timeCoverage.end === "ongoing" ? new Date().getFullYear() : dataset.timeCoverage.end;
}

function matchesAny<T>(selected: T[], values: T[]): boolean {
  return selected.length === 0 || selected.some((value) => values.includes(value));
}

/** Full-text score across the fields a researcher is likely to search. */
export function textScore(dataset: Dataset, query: string): number {
  const trimmed = query.trim();
  if (trimmed.length === 0) return 0;
  const needle = trimmed.toLowerCase();

  // Exact substring hits on identity fields rank hardest.
  if (
    dataset.acronym.toLowerCase() === needle ||
    dataset.name.toLowerCase().includes(needle) ||
    dataset.acronym.toLowerCase().includes(needle)
  ) {
    return 1000;
  }

  const tokens = tokenSet(trimmed);
  if (tokens.size === 0) return 0;

  return (
    overlapCount(tokens, dataset.name) * 40 +
    overlapCount(tokens, dataset.summary) * 12 +
    overlapCount(tokens, dataset.diseaseAreas.join(" ")) * 20 +
    overlapCount(tokens, dataset.dataCategories.join(" ")) * 20 +
    overlapCount(tokens, dataset.holder) * 8 +
    overlapCount(tokens, dataset.country) * 15 +
    dataset.variables.reduce(
      (total, variable) => total + overlapCount(tokens, `${variable.name} ${variable.description}`) * 4,
      0,
    )
  );
}

/**
 * Applies every facet plus the free-text query.
 *
 * Pure and synchronous. The catalogue is small enough that filtering on every
 * keystroke stays well inside a frame budget, which is why the prototype needs
 * no search index or server round-trip.
 */
export function filterDatasets(datasets: Dataset[], filters: CatalogueFilters): Dataset[] {
  const results = datasets.filter((dataset) => {
    if (!matchesAny(filters.countries, [dataset.country])) return false;
    if (!matchesAny(filters.diseaseAreas, dataset.diseaseAreas)) return false;
    if (!matchesAny(filters.dataCategories, dataset.dataCategories)) return false;
    if (!matchesAny(filters.populations, dataset.populations)) return false;
    if (!matchesAny(filters.updateFrequencies, [dataset.updateFrequency])) return false;
    if (!matchesAny(filters.codingSystems, dataset.codingSystems)) return false;
    if (!matchesAny(filters.accessBodies, [dataset.accessBody.id])) return false;
    if (!matchesAny(filters.accessComplexities, [dataset.accessComplexity])) return false;
    if (!matchesAny(filters.linkageStatuses, [dataset.linkage.status])) return false;

    if (filters.coverageFrom !== null && coverageEnd(dataset) < filters.coverageFrom) return false;
    if (filters.coverageTo !== null && dataset.timeCoverage.start > filters.coverageTo) return false;

    if (filters.minCohortSize !== null && dataset.approximateCohortSize < filters.minCohortSize) return false;
    if (filters.minCompleteness !== null && dataset.quality.completeness < filters.minCompleteness) return false;
    if (filters.minInteroperability !== null && dataset.quality.interoperability < filters.minInteroperability)
      return false;
    if (filters.minTimeliness !== null && dataset.quality.timeliness < filters.minTimeliness) return false;

    if (filters.query.trim().length > 0 && textScore(dataset, filters.query) === 0) return false;
    return true;
  });

  if (filters.query.trim().length === 0) {
    return results.sort((a, b) => a.name.localeCompare(b.name));
  }
  return results.sort(
    (a, b) => textScore(b, filters.query) - textScore(a, filters.query) || a.name.localeCompare(b.name),
  );
}

/**
 * Counts how many datasets would remain if a given facet value were added to
 * the current selection. Facet counts are computed against the results of all
 * *other* facets, which is what keeps them useful rather than misleading.
 */
export function facetCounts<K extends keyof CatalogueFilters>(
  datasets: Dataset[],
  filters: CatalogueFilters,
  facet: K,
  values: readonly string[],
  accessor: (dataset: Dataset) => string[],
): Record<string, number> {
  const withoutThisFacet = filterDatasets(datasets, { ...filters, [facet]: [] } as CatalogueFilters);
  const counts: Record<string, number> = {};
  for (const value of values) {
    counts[value] = withoutThisFacet.filter((dataset) => accessor(dataset).includes(value)).length;
  }
  return counts;
}

export function activeFilterCount(filters: CatalogueFilters): number {
  let count = 0;
  if (filters.query.trim()) count += 1;
  count += filters.countries.length;
  count += filters.diseaseAreas.length;
  count += filters.dataCategories.length;
  count += filters.populations.length;
  count += filters.updateFrequencies.length;
  count += filters.codingSystems.length;
  count += filters.accessBodies.length;
  count += filters.accessComplexities.length;
  count += filters.linkageStatuses.length;
  if (filters.coverageFrom !== null) count += 1;
  if (filters.coverageTo !== null) count += 1;
  if (filters.minCohortSize !== null) count += 1;
  if (filters.minCompleteness !== null) count += 1;
  if (filters.minInteroperability !== null) count += 1;
  if (filters.minTimeliness !== null) count += 1;
  return count;
}
