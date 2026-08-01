import type { CodingSystem, Dataset, Recommendation } from "@/lib/types";

/** Coverage end expressed as a comparable number. */
function coverageEnd(dataset: Dataset): number {
  return dataset.timeCoverage.end === "ongoing" ? new Date().getFullYear() : dataset.timeCoverage.end;
}

export interface CoverageIntersection {
  start: number;
  end: number;
  /** False when the datasets share no overlapping years at all. */
  valid: boolean;
}

/** The analysable window shared by every dataset in a project. */
export function intersectCoverage(datasets: Dataset[]): CoverageIntersection {
  if (datasets.length === 0) return { start: 0, end: 0, valid: false };
  const start = Math.max(...datasets.map((dataset) => dataset.timeCoverage.start));
  const end = Math.min(...datasets.map(coverageEnd));
  return { start, end, valid: end >= start };
}

/** Governing conditions when several holders' rules apply at once. */
export function governingConstraints(datasets: Dataset[]) {
  return {
    aggregationThreshold: Math.max(
      ...datasets.map((dataset) => dataset.accessConditions.minimumAggregationThreshold),
    ),
    maximumAccessMonths: Math.min(
      ...datasets.map((dataset) => dataset.accessConditions.maximumAccessMonths),
    ),
    secureEnvironmentRequired: datasets.some(
      (dataset) => dataset.accessConditions.secureProcessingEnvironmentRequired,
    ),
    longestDecisionDays: Math.max(
      ...datasets.map((dataset) => dataset.accessBody.indicativeDecisionDays),
    ),
    jurisdictions: Array.from(new Set(datasets.map((dataset) => dataset.accessBody.name))).sort(),
    countries: Array.from(new Set(datasets.map((dataset) => dataset.country))).sort(),
  };
}

/** Whether a pair of datasets has any declared route to record-level linkage. */
export function pairLinkage(a: Dataset, b: Dataset): {
  feasible: boolean;
  level: "established" | "possible" | "blocked";
  explanation: string;
} {
  if (a.linkage.status === "No linkage supported" || b.linkage.status === "No linkage supported") {
    const blocker = a.linkage.status === "No linkage supported" ? a : b;
    return {
      feasible: false,
      level: "blocked",
      explanation: `${blocker.acronym} declares no linkage support, so record-level combination with ${
        blocker.id === a.id ? b.acronym : a.acronym
      } is not available.`,
    };
  }
  if (a.linkage.knownLinkedDatasets.includes(b.id) || b.linkage.knownLinkedDatasets.includes(a.id)) {
    return {
      feasible: true,
      level: "established",
      explanation: `These holders have completed a joint release before, which usually shortens technical set-up.`,
    };
  }
  if (a.country === b.country && a.linkage.status === "National pseudonymous key available" && b.linkage.status === "National pseudonymous key available") {
    return {
      feasible: true,
      level: "established",
      explanation: `Both datasets are held in ${a.country} and declare the same national pseudonymous key.`,
    };
  }
  if (a.country !== b.country) {
    return {
      feasible: false,
      level: "possible",
      explanation:
        "The datasets sit in different jurisdictions and declare no shared key. Cross-border record-level linkage would need a bilateral arrangement that the catalogue does not record as established.",
    };
  }
  return {
    feasible: true,
    level: "possible",
    explanation:
      "Both holders support project-specific linkage through a trusted third party, which must be arranged and funded as part of the permit.",
  };
}

const DIAGNOSIS_CLASSIFICATIONS: CodingSystem[] = ["ICD-10", "ICD-11", "SNOMED CT", "ICPC-2"];
/** Revisions of the same classification family, which do not interoperate. */
const ICD_REVISIONS: CodingSystem[] = ["ICD-10", "ICD-11"];

/**
 * Terminology findings for a dataset pair.
 *
 * A shared terminology somewhere in the pair does not resolve a mismatch in the
 * classification each holder actually codes diagnoses with. Two datasets can
 * both declare SNOMED CT and still record diagnoses in different ICD revisions,
 * so a revision mismatch is treated as a conflict in its own right rather than
 * being masked by the shared entry.
 */
export function pairTerminology(a: Dataset, b: Dataset): {
  shared: CodingSystem[];
  diagnosisConflict: CodingSystem[];
  localOnly: Dataset[];
} {
  const shared = a.codingSystems.filter((system) => b.codingSystems.includes(system));
  const aDiagnosis = a.codingSystems.filter((system) => DIAGNOSIS_CLASSIFICATIONS.includes(system));
  const bDiagnosis = b.codingSystems.filter((system) => DIAGNOSIS_CLASSIFICATIONS.includes(system));

  const aIcd = a.codingSystems.filter((system) => ICD_REVISIONS.includes(system));
  const bIcd = b.codingSystems.filter((system) => ICD_REVISIONS.includes(system));
  const icdRevisionMismatch =
    aIcd.length > 0 && bIcd.length > 0 && aIcd.every((system) => !bIcd.includes(system));

  const noSharedClassification =
    aDiagnosis.length > 0 &&
    bDiagnosis.length > 0 &&
    aDiagnosis.every((system) => !bDiagnosis.includes(system));

  const diagnosisConflict =
    icdRevisionMismatch || noSharedClassification
      ? Array.from(new Set([...aDiagnosis, ...bDiagnosis])).filter(
          (system) => !(aDiagnosis.includes(system) && bDiagnosis.includes(system)),
        )
      : [];

  const localOnly = [a, b].filter((dataset) => dataset.codingSystems.includes("Local proprietary codes"));
  return { shared, diagnosisConflict, localOnly };
}

export interface CompatibilityCell {
  aId: string;
  bId: string;
  /** 0–100 heuristic combination score. */
  score: number;
  linkage: ReturnType<typeof pairLinkage>;
  sharedYears: CoverageIntersection;
  sharedPopulations: string[];
  terminology: ReturnType<typeof pairTerminology>;
}

/** Pairwise matrix used by the comparison workspace. */
export function compatibilityMatrix(datasets: Dataset[]): CompatibilityCell[] {
  const cells: CompatibilityCell[] = [];
  for (let i = 0; i < datasets.length; i += 1) {
    for (let j = i + 1; j < datasets.length; j += 1) {
      const a = datasets[i];
      const b = datasets[j];
      const linkage = pairLinkage(a, b);
      const sharedYears = intersectCoverage([a, b]);
      const sharedPopulations = a.populations.filter((population) => b.populations.includes(population));
      const terminology = pairTerminology(a, b);

      let score = 100;
      if (linkage.level === "blocked") score -= 45;
      else if (linkage.level === "possible") score -= 20;
      if (!sharedYears.valid) score -= 30;
      else if (sharedYears.end - sharedYears.start < 3) score -= 10;
      if (sharedPopulations.length === 0) score -= 15;
      if (terminology.diagnosisConflict.length > 0) score -= 15;
      if (terminology.shared.length === 0) score -= 10;
      if (a.country !== b.country) score -= 10;
      score -= Math.round(Math.abs(a.quality.interoperability - b.quality.interoperability) / 10);

      cells.push({
        aId: a.id,
        bId: b.id,
        score: Math.max(0, Math.min(100, score)),
        linkage,
        sharedYears,
        sharedPopulations,
        terminology,
      });
    }
  }
  return cells;
}

/* -------------------------------------------------------------------------- */
/* Recommendations                                                             */
/* -------------------------------------------------------------------------- */

export function compatibilityRecommendations(datasets: Dataset[]): Recommendation[] {
  if (datasets.length < 2) return [];
  const findings: Recommendation[] = [];
  const constraints = governingConstraints(datasets);
  const matrix = compatibilityMatrix(datasets);

  /* CMP-01 — linkage blockers -------------------------------------------- */
  for (const cell of matrix) {
    if (cell.linkage.level === "blocked" || (cell.linkage.level === "possible" && !cell.linkage.feasible)) {
      const a = datasets.find((dataset) => dataset.id === cell.aId)!;
      const b = datasets.find((dataset) => dataset.id === cell.bId)!;
      findings.push({
        id: `CMP-01:${cell.aId}:${cell.bId}`,
        kind: "cross-dataset-compatibility",
        severity: cell.linkage.level === "blocked" ? "attention" : "advisory",
        title: `Record-level linkage between ${a.acronym} and ${b.acronym} is not established`,
        reason: cell.linkage.explanation,
        suggestedAction:
          "Consider whether an ecological or meta-analytic design using separately derived aggregates would answer the question, or confirm a linkage route with both access bodies before relying on it.",
        evidence: [
          `${a.acronym}: ${a.linkage.status}`,
          `${b.acronym}: ${b.linkage.status}`,
          a.country === b.country ? `Both held in ${a.country}.` : `Held in ${a.country} and ${b.country}.`,
        ],
        ruleId: "CMP-01",
        scope: { datasetIds: [cell.aId, cell.bId] },
        source: "deterministic-rules",
        confidence: cell.linkage.level === "blocked" ? 0.9 : 0.6,
      });
    }
  }

  /* CMP-02 — cross-border combination ------------------------------------ */
  if (constraints.countries.length > 1) {
    findings.push({
      id: `CMP-02:${constraints.countries.join("-")}`,
      kind: "cross-dataset-compatibility",
      severity: "advisory",
      title: `This project spans ${constraints.countries.length} jurisdictions`,
      reason: `Datasets are held in ${constraints.countries.join(", ")}, each with its own access body and its own process. In this fictional catalogue the longest indicative decision time among them is ${constraints.longestDecisionDays} working days.`,
      suggestedAction:
        "Plan parallel applications, allow for the slowest decision, and confirm with each access body whether a coordinated route exists.",
      evidence: constraints.jurisdictions,
      ruleId: "CMP-02",
      scope: { datasetIds: datasets.map((dataset) => dataset.id) },
      source: "deterministic-rules",
      confidence: 0.95,
    });
  }

  /* CMP-03 — time-coverage intersection ---------------------------------- */
  const coverage = intersectCoverage(datasets);
  if (!coverage.valid) {
    findings.push({
      id: "CMP-03:no-overlap",
      kind: "cross-dataset-compatibility",
      severity: "attention",
      title: "The selected datasets share no common years",
      reason:
        "The latest start year across the project is after the earliest end year, so there is no period in which every dataset holds records.",
      suggestedAction:
        "Remove a dataset, or restructure the design so that sources are used for different phases rather than a single combined period.",
      evidence: datasets.map(
        (dataset) => `${dataset.acronym}: ${dataset.timeCoverage.start}–${dataset.timeCoverage.end}`,
      ),
      ruleId: "CMP-03",
      scope: { datasetIds: datasets.map((dataset) => dataset.id) },
      source: "deterministic-rules",
      confidence: 0.95,
    });
  } else if (coverage.end - coverage.start < 5) {
    findings.push({
      id: "CMP-03:narrow-overlap",
      kind: "cross-dataset-compatibility",
      severity: "advisory",
      title: `The shared analysable window is only ${coverage.end - coverage.start + 1} year(s)`,
      reason: `Every dataset in the project holds records for ${coverage.start}–${coverage.end}. Outside that window at least one source is unavailable.`,
      suggestedAction:
        "Check that the shared window supports your follow-up requirements, or use a design tolerant of unbalanced coverage.",
      evidence: datasets.map(
        (dataset) => `${dataset.acronym}: ${dataset.timeCoverage.start}–${dataset.timeCoverage.end}`,
      ),
      ruleId: "CMP-03",
      scope: { datasetIds: datasets.map((dataset) => dataset.id) },
      source: "deterministic-rules",
      confidence: 0.8,
    });
  }

  /* CMP-04 — population overlap ------------------------------------------ */
  for (const cell of matrix) {
    if (cell.sharedPopulations.length === 0) {
      const a = datasets.find((dataset) => dataset.id === cell.aId)!;
      const b = datasets.find((dataset) => dataset.id === cell.bId)!;
      findings.push({
        id: `CMP-04:${cell.aId}:${cell.bId}`,
        kind: "cross-dataset-compatibility",
        severity: "advisory",
        title: `${a.acronym} and ${b.acronym} declare no shared population`,
        reason:
          "The two datasets list no population group in common, which suggests they may describe different groups of people.",
        suggestedAction:
          "Confirm that a coherent study cohort can be defined across both sources before relying on the combination.",
        evidence: [
          `${a.acronym}: ${a.populations.join(", ")}`,
          `${b.acronym}: ${b.populations.join(", ")}`,
        ],
        ruleId: "CMP-04",
        scope: { datasetIds: [cell.aId, cell.bId] },
        source: "deterministic-rules",
        confidence: 0.5,
      });
    }
  }

  /* CMP-05 — cadence and closed archives ---------------------------------- */
  const closed = datasets.filter((dataset) => dataset.timeCoverage.end !== "ongoing");
  const continuous = datasets.filter((dataset) => dataset.updateFrequency === "Continuous");
  if (closed.length > 0 && continuous.length > 0) {
    findings.push({
      id: `CMP-05:${closed.map((dataset) => dataset.id).join("-")}`,
      kind: "cross-dataset-compatibility",
      severity: "advisory",
      title: "A closed archive is combined with continuously updated sources",
      reason: `${closed
        .map((dataset) => `${dataset.acronym} ends in ${dataset.timeCoverage.end}`)
        .join("; ")}, while ${continuous
        .map((dataset) => dataset.acronym)
        .join(", ")} update continuously. The combined analysis cannot extend past the archive's end.`,
      suggestedAction:
        "Set the study period to end no later than the closed source, or justify why the archive is needed for only part of the analysis.",
      evidence: datasets.map((dataset) => `${dataset.acronym}: ${dataset.updateFrequency} updates`),
      ruleId: "CMP-05",
      scope: { datasetIds: datasets.map((dataset) => dataset.id) },
      source: "deterministic-rules",
      confidence: 0.85,
    });
  }

  /* CMP-06 — governing constraints ---------------------------------------- */
  const strictest = datasets.reduce((current, dataset) =>
    dataset.accessConditions.minimumAggregationThreshold >
    current.accessConditions.minimumAggregationThreshold
      ? dataset
      : current,
  );
  const shortest = datasets.reduce((current, dataset) =>
    dataset.accessConditions.maximumAccessMonths < current.accessConditions.maximumAccessMonths
      ? dataset
      : current,
  );
  if (
    new Set(datasets.map((dataset) => dataset.accessConditions.minimumAggregationThreshold)).size > 1 ||
    new Set(datasets.map((dataset) => dataset.accessConditions.maximumAccessMonths)).size > 1
  ) {
    findings.push({
      id: "CMP-06:governing",
      kind: "cross-dataset-compatibility",
      severity: "info",
      title: "The strictest access conditions will govern this project",
      reason: `Conditions differ across the selected datasets. Assume the strictest applies: a minimum cell size of ${constraints.aggregationThreshold} (from ${strictest.acronym}) and a maximum access period of ${constraints.maximumAccessMonths} months (from ${shortest.acronym}).`,
      suggestedAction:
        "Design outputs against the strictest threshold and request a duration within the shortest maximum, or explain why an exception is needed.",
      evidence: datasets.map(
        (dataset) =>
          `${dataset.acronym}: min cell ${dataset.accessConditions.minimumAggregationThreshold}, max ${dataset.accessConditions.maximumAccessMonths} months`,
      ),
      ruleId: "CMP-06",
      scope: { datasetIds: datasets.map((dataset) => dataset.id) },
      source: "deterministic-rules",
      confidence: 0.9,
    });
  }

  /* CMP-07 — interoperability spread -------------------------------------- */
  const interop = datasets.map((dataset) => dataset.quality.interoperability);
  const spread = Math.max(...interop) - Math.min(...interop);
  if (spread >= 25) {
    const weakest = datasets.reduce((current, dataset) =>
      dataset.quality.interoperability < current.quality.interoperability ? dataset : current,
    );
    findings.push({
      id: `CMP-07:${weakest.id}`,
      kind: "cross-dataset-compatibility",
      severity: "advisory",
      title: `Harmonisation effort will concentrate on ${weakest.acronym}`,
      reason: `Interoperability scores in this project span ${spread} points. ${weakest.acronym} scores ${weakest.quality.interoperability}/100, well below the rest of the selection.`,
      suggestedAction:
        "Budget explicit time for mapping work on the weakest source and describe that work in the analysis plan.",
      evidence: datasets.map(
        (dataset) => `${dataset.acronym}: interoperability ${dataset.quality.interoperability}/100`,
      ),
      ruleId: "CMP-07",
      scope: { datasetIds: [weakest.id] },
      source: "deterministic-rules",
      confidence: 0.7,
    });
  }

  return findings;
}
