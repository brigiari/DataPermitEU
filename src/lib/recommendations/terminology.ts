import type { Dataset, Recommendation } from "@/lib/types";
import { pairTerminology } from "@/lib/recommendations/compatibility";

/**
 * Terminology findings.
 *
 * Kept separate from the general compatibility rules because this is the layer
 * most obviously destined to be replaced by a real terminology service (an
 * SNOMED CT or LOINC server able to reason about actual concept mappings
 * rather than declared coding-system labels).
 */
export function terminologyRecommendations(datasets: Dataset[]): Recommendation[] {
  const findings: Recommendation[] = [];
  if (datasets.length === 0) return findings;

  /* TRM-01 / TRM-03 — pairwise classification comparison ----------------- */
  for (let i = 0; i < datasets.length; i += 1) {
    for (let j = i + 1; j < datasets.length; j += 1) {
      const a = datasets[i];
      const b = datasets[j];
      const { shared, diagnosisConflict } = pairTerminology(a, b);

      if (diagnosisConflict.length > 0) {
        findings.push({
          id: `TRM-01:${a.id}:${b.id}`,
          kind: "terminology-conflict",
          severity: "attention",
          title: `${a.acronym} and ${b.acronym} use different diagnosis classifications`,
          reason: `${a.acronym} codes diagnoses using ${a.codingSystems
            .filter((system) => diagnosisConflict.includes(system))
            .join(", ")}, while ${b.acronym} uses ${b.codingSystems
            .filter((system) => diagnosisConflict.includes(system))
            .join(", ")}. A cohort definition written for one will not transfer unchanged to the other.`,
          suggestedAction:
            "Describe the crosswalk you intend to use, state its version, and record in the analysis plan how mapping losses will be quantified.",
          evidence: [
            `${a.acronym}: ${a.codingSystems.join(", ")}`,
            `${b.acronym}: ${b.codingSystems.join(", ")}`,
          ],
          ruleId: "TRM-01",
          scope: { datasetIds: [a.id, b.id] },
          source: "deterministic-rules",
          confidence: 0.85,
        });
      }

      if (shared.length === 0) {
        findings.push({
          id: `TRM-03:${a.id}:${b.id}`,
          kind: "terminology-conflict",
          severity: "advisory",
          title: `${a.acronym} and ${b.acronym} share no coding system`,
          reason:
            "The two datasets declare no terminology in common, so every concept used across both will need a bespoke mapping step.",
          suggestedAction:
            "Confirm which concepts genuinely need to be expressed in both sources and scope the mapping work accordingly.",
          evidence: [
            `${a.acronym}: ${a.codingSystems.join(", ")}`,
            `${b.acronym}: ${b.codingSystems.join(", ")}`,
          ],
          ruleId: "TRM-03",
          scope: { datasetIds: [a.id, b.id] },
          source: "deterministic-rules",
          confidence: 0.55,
        });
      }
    }
  }

  /* TRM-02 — local proprietary coding ------------------------------------ */
  for (const dataset of datasets) {
    if (dataset.codingSystems.includes("Local proprietary codes")) {
      const affected = dataset.variables.filter(
        (variable) => variable.codingSystem === "Local proprietary codes",
      );
      findings.push({
        id: `TRM-02:${dataset.id}`,
        kind: "terminology-conflict",
        severity: "advisory",
        title: `${dataset.acronym} uses a local coding scheme`,
        reason: `${dataset.acronym} declares local proprietary codes${
          affected.length > 0
            ? `, affecting ${affected.map((variable) => variable.name).join(", ")}`
            : ""
        }. Local schemes need a mapping step before results can be compared with other sources or published against an international classification.`,
        suggestedAction:
          "Ask the holder whether a published crosswalk exists, and if not, plan and resource the mapping work explicitly.",
        evidence: [
          `Declared coding systems: ${dataset.codingSystems.join(", ")}`,
          ...dataset.quality.notes.filter((note) => /cod|map|scheme|terminolog/i.test(note)),
        ],
        ruleId: "TRM-02",
        scope: {
          datasetIds: [dataset.id],
          variableIds: affected.map((variable) => variable.id),
        },
        source: "deterministic-rules",
        confidence: 0.8,
      });
    }
  }

  /* TRM-04 — partial common data model ----------------------------------- */
  if (datasets.length > 1) {
    const withCdm = datasets.filter((dataset) => dataset.codingSystems.includes("OMOP CDM v5.4"));
    if (withCdm.length > 0 && withCdm.length < datasets.length) {
      const without = datasets.filter((dataset) => !dataset.codingSystems.includes("OMOP CDM v5.4"));
      findings.push({
        id: "TRM-04:partial-cdm",
        kind: "terminology-conflict",
        severity: "info",
        title: "Only part of this project is available in a common data model",
        reason: `${withCdm
          .map((dataset) => dataset.acronym)
          .join(", ")} declare an OMOP CDM v5.4 mapping, while ${without
          .map((dataset) => dataset.acronym)
          .join(", ")} do not. Analysis code cannot be written once against a single model.`,
        suggestedAction:
          "Decide early whether to map the remaining sources into the common model or to write source-specific extraction code, and record the choice in the analysis plan.",
        evidence: datasets.map(
          (dataset) =>
            `${dataset.acronym}: ${
              dataset.codingSystems.includes("OMOP CDM v5.4") ? "OMOP CDM available" : "no common data model declared"
            }`,
        ),
        ruleId: "TRM-04",
        scope: { datasetIds: without.map((dataset) => dataset.id) },
        source: "deterministic-rules",
        confidence: 0.75,
      });
    }
  }

  return findings;
}
