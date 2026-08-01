import type { ApplicationDraft, Dataset, Recommendation } from "@/lib/types";
import { containsAny, wordCount } from "@/lib/text";
import {
  IDENTIFICATION_TERMS,
  PROHIBITED_PURPOSE_TERMS,
  PUBLIC_BENEFIT_TERMS,
  PURPOSE_CATEGORY_TERMS,
} from "@/lib/recommendations/concepts";

/**
 * Research-purpose concerns.
 *
 * These rules flag *wording that a reviewer is likely to query*. They make no
 * legal or ethical determination, and the copy is written to keep that
 * distinction visible in the interface.
 */
export function purposeRecommendations(
  application: ApplicationDraft,
  datasets: Dataset[],
): Recommendation[] {
  const findings: Recommendation[] = [];
  const narrative = [
    application.researchPurpose,
    application.publicInterestJustification,
    application.analysisPlan,
    application.expectedOutputs,
  ].join(" ");

  if (narrative.trim().length === 0) return findings;

  /* PUR-01 — language resembling a prohibited purpose --------------------- */
  const prohibitedHits = containsAny(narrative, PROHIBITED_PURPOSE_TERMS);
  if (prohibitedHits.length > 0) {
    const relatedDatasets = datasets.filter((dataset) =>
      dataset.prohibitedPurposes.some((purpose) =>
        prohibitedHits.some((hit) => purpose.toLowerCase().includes(hit.toLowerCase())),
      ),
    );
    findings.push({
      id: `PUR-01:${prohibitedHits.join("-").replace(/[^a-z-]/g, "")}`,
      kind: "purpose-concern",
      severity: "attention",
      title: "The purpose text uses language associated with prohibited uses",
      reason: `The application text contains ${prohibitedHits
        .map((hit) => `"${hit}"`)
        .join(", ")}. Datasets in this catalogue list closely related activities as prohibited purposes. Even when the study intent is legitimate, this wording commonly triggers a clarification request.`,
      suggestedAction:
        "Re-read the sentence containing the flagged term. If the study does not involve that activity, say so explicitly rather than leaving the reader to infer it.",
      evidence: [
        ...prohibitedHits.map((hit) => `Matched term: "${hit}"`),
        ...relatedDatasets
          .slice(0, 3)
          .map((dataset) => `${dataset.acronym} prohibits: ${dataset.prohibitedPurposes[0]}`),
      ],
      ruleId: "PUR-01",
      scope: { section: "purpose", datasetIds: relatedDatasets.map((dataset) => dataset.id) },
      source: "deterministic-rules",
      confidence: 0.55,
    });
  }

  /* PUR-02 — weak public-interest justification --------------------------- */
  const benefitHits = containsAny(application.publicInterestJustification, PUBLIC_BENEFIT_TERMS);
  const justificationWords = wordCount(application.publicInterestJustification);
  if (justificationWords >= 5 && benefitHits.length < 2) {
    findings.push({
      id: "PUR-02:public-interest",
      kind: "purpose-concern",
      severity: "advisory",
      title: "The public-interest justification does not name a beneficiary or a benefit",
      reason: `The justification is ${justificationWords} words long but contains ${
        benefitHits.length === 0 ? "no term" : "only one term"
      } describing who benefits or what improves. Access bodies generally assess public interest as a distinct criterion from scientific merit.`,
      suggestedAction:
        "State plainly who stands to benefit — patients, clinicians, a health system, a policy process — and what would change if the study succeeds.",
      evidence: [
        `Terms the rule looked for: ${PUBLIC_BENEFIT_TERMS.slice(0, 8).join(", ")}`,
        benefitHits.length > 0 ? `Found: ${benefitHits.join(", ")}` : "None of those terms were found.",
      ],
      ruleId: "PUR-02",
      scope: { section: "purpose" },
      source: "deterministic-rules",
      confidence: 0.6,
    });
  }

  /* PUR-03 — identification or contact language ---------------------------- */
  const identificationHits = containsAny(narrative, IDENTIFICATION_TERMS);
  if (identificationHits.length > 0) {
    findings.push({
      id: `PUR-03:identification`,
      kind: "purpose-concern",
      severity: "attention",
      title: "The application refers to identifying or contacting individuals",
      reason: `The text contains ${identificationHits
        .map((hit) => `"${hit}"`)
        .join(", ")}. Every dataset in this catalogue prohibits re-identification, and participant contact is a separate approval in its own right.`,
      suggestedAction:
        "If the phrase describes something the study will not do, rewrite it as an explicit commitment. If contact is genuinely intended, it needs its own approval route and should not be folded into a secondary-use request.",
      evidence: identificationHits.map((hit) => `Matched phrase: "${hit}"`),
      ruleId: "PUR-03",
      scope: { section: "purpose" },
      source: "deterministic-rules",
      confidence: 0.7,
    });
  }

  /* PUR-04 — category inconsistent with the narrative ---------------------- */
  if (application.purposeCategory !== "") {
    const expected = PURPOSE_CATEGORY_TERMS[application.purposeCategory] ?? [];
    const categoryHits = containsAny(narrative, expected);
    const alternatives = Object.entries(PURPOSE_CATEGORY_TERMS)
      .filter(([key]) => key !== application.purposeCategory)
      .map(([key, terms]) => ({ key, hits: containsAny(narrative, terms).length }))
      .filter((candidate) => candidate.hits > categoryHits.length + 1)
      .sort((a, b) => b.hits - a.hits);

    if (categoryHits.length === 0 && alternatives.length > 0 && wordCount(narrative) > 30) {
      findings.push({
        id: `PUR-04:${application.purposeCategory}`,
        kind: "purpose-concern",
        severity: "advisory",
        title: `The narrative reads more like "${alternatives[0].key.replace(/-/g, " ")}" than the selected category`,
        reason: `You selected "${application.purposeCategory.replace(
          /-/g,
          " ",
        )}", but the text contains no term associated with that category and ${
          alternatives[0].hits
        } term(s) associated with "${alternatives[0].key.replace(/-/g, " ")}".`,
        suggestedAction:
          "Check the category selection. Many studies span categories, in which case say so in the purpose narrative rather than leaving the mismatch unexplained.",
        evidence: [
          `Selected category: ${application.purposeCategory}`,
          `Terms expected for that category: ${expected.slice(0, 6).join(", ")}`,
          `Closest alternative by term count: ${alternatives[0].key}`,
        ],
        ruleId: "PUR-04",
        scope: { section: "purpose" },
        source: "deterministic-rules",
        confidence: 0.45,
      });
    }

    /* Permitted-purpose cross-check against the catalogue ----------------- */
    if (application.purposeCategory === "innovation-development") {
      const restrictive = datasets.filter(
        (dataset) =>
          !dataset.permittedPurposes.some((purpose) => /innovation|development/i.test(purpose)),
      );
      if (restrictive.length > 0) {
        findings.push({
          id: "PUR-04:innovation-scope",
          kind: "purpose-concern",
          severity: "attention",
          title: `${restrictive.map((dataset) => dataset.acronym).join(", ")} do not list innovation and development as a permitted purpose`,
          reason:
            "The declared purpose category is innovation and development, but these datasets' permitted-purpose lists in this fictional catalogue do not include it.",
          suggestedAction:
            "Confirm with each access body whether the intended use falls within their permitted purposes before building the study around these sources.",
          evidence: restrictive.map(
            (dataset) => `${dataset.acronym} permits: ${dataset.permittedPurposes.join("; ")}`,
          ),
          ruleId: "PUR-04",
          scope: { section: "purpose", datasetIds: restrictive.map((dataset) => dataset.id) },
          source: "deterministic-rules",
          confidence: 0.8,
        });
      }
    }
  }

  return findings;
}
