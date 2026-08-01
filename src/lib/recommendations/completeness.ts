import type {
  ApplicationDraft,
  Dataset,
  Recommendation,
  RequiredDocumentId,
} from "@/lib/types";
import { containsAny, wordCount } from "@/lib/text";
import { AMBIGUOUS_PHRASES } from "@/lib/recommendations/concepts";
import { governingConstraints, intersectCoverage } from "@/lib/recommendations/compatibility";
import { DOCUMENT_LABELS } from "@/lib/data/documents";

interface FieldCheck {
  section: string;
  label: string;
  value: string;
  minWords: number;
  why: string;
}

function fieldChecks(application: ApplicationDraft): FieldCheck[] {
  return [
    {
      section: "purpose",
      label: "Research purpose",
      value: application.researchPurpose,
      minWords: 25,
      why: "The purpose statement is the anchor for every other assessment in the application.",
    },
    {
      section: "purpose",
      label: "Public-interest justification",
      value: application.publicInterestJustification,
      minWords: 20,
      why: "Secondary-use processes generally assess public interest explicitly and separately from scientific merit.",
    },
    {
      section: "scope",
      label: "Population description",
      value: application.populationDescription,
      minWords: 12,
      why: "The cohort definition determines how much data is actually released.",
    },
    {
      section: "method",
      label: "Analysis plan",
      value: application.analysisPlan,
      minWords: 30,
      why: "A reviewer cannot judge whether the requested variables are necessary without knowing how they will be used.",
    },
    {
      section: "method",
      label: "Statistical methods",
      value: application.statisticalMethods,
      minWords: 12,
      why: "Method detail supports both the necessity argument and the output-checking arrangements.",
    },
    {
      section: "governance",
      label: "Legal basis note",
      value: application.legalBasisNote,
      minWords: 10,
      why: "Access bodies expect an explicit statement of the basis being relied on, confirmed with your own legal advisers.",
    },
    {
      section: "governance",
      label: "Ethics note",
      value: application.ethicsNote,
      minWords: 10,
      why: "Ethical review arrangements are assessed alongside the legal basis.",
    },
    {
      section: "outputs",
      label: "Expected outputs",
      value: application.expectedOutputs,
      minWords: 15,
      why: "Expected outputs shape the disclosure-control arrangements the holder will apply.",
    },
    {
      section: "outputs",
      label: "Output disclosure controls",
      value: application.outputDisclosureControls,
      minWords: 10,
      why: "Every dataset in this catalogue applies output checking; describing your own controls speeds that up.",
    },
    {
      section: "outputs",
      label: "Retention and destruction plan",
      value: application.dataDestructionPlan,
      minWords: 10,
      why: "Access periods end, and holders expect a stated plan for what happens then.",
    },
  ];
}

const ATTESTATION_LABELS: Record<keyof ApplicationDraft["attestations"], string> = {
  noReidentification: "No attempt will be made to re-identify individuals",
  secureEnvironmentOnly: "Analysis will take place only in the approved secure processing environment",
  outputCheckingAccepted: "Output checking by the data holder is accepted",
  guidanceIsEducational:
    "The guidance in this prototype is educational and does not replace advice from legal, ethical or data-access authorities",
};

/**
 * Missing-information and readiness rules.
 *
 * These drive the readiness dashboard. They deliberately check for *presence
 * and clarity*, never for correctness — the prototype has no standing to
 * judge whether an answer is right.
 */
export function completenessRecommendations(
  application: ApplicationDraft,
  datasets: Dataset[],
): Recommendation[] {
  const findings: Recommendation[] = [];

  /* MIS-01 — unanswered or thin sections ---------------------------------- */
  for (const check of fieldChecks(application)) {
    const words = wordCount(check.value);
    if (words < check.minWords) {
      findings.push({
        id: `MIS-01:${check.label.toLowerCase().replace(/[^a-z]+/g, "-")}`,
        kind: "missing-information",
        severity: words === 0 ? "attention" : "advisory",
        title: words === 0 ? `${check.label} is empty` : `${check.label} is very brief`,
        reason: `${
          words === 0
            ? "Nothing has been recorded here."
            : `This section has ${words} word(s); the prototype's guide length is ${check.minWords}.`
        } ${check.why}`,
        suggestedAction: `Expand ${check.label.toLowerCase()} so a reviewer unfamiliar with the study could assess it without asking questions.`,
        evidence: [`Recorded length: ${words} word(s)`, `Guide length: ${check.minWords} word(s)`],
        ruleId: "MIS-01",
        scope: { section: check.section },
        source: "deterministic-rules",
        confidence: words === 0 ? 0.95 : 0.6,
      });
    }
  }

  if (application.purposeCategory === "") {
    findings.push({
      id: "MIS-01:purpose-category",
      kind: "missing-information",
      severity: "attention",
      title: "No purpose category has been selected",
      reason:
        "The purpose category determines which permitted-purpose list the request is assessed against, so it cannot be left blank.",
      suggestedAction: "Select the category that best matches the study and check it against each dataset's permitted purposes.",
      evidence: ["Purpose category is unset."],
      ruleId: "MIS-01",
      scope: { section: "purpose" },
      source: "deterministic-rules",
      confidence: 0.95,
    });
  }

  /* MIS-02 — documents required by selected datasets ---------------------- */
  const required = new Set<RequiredDocumentId>();
  for (const dataset of datasets) {
    for (const document of dataset.accessConditions.requiredDocuments) required.add(document);
  }
  for (const documentId of Array.from(required).sort()) {
    const record = application.documents.find((entry) => entry.id === documentId);
    if (!record || record.status !== "attached") {
      const requiredBy = datasets
        .filter((dataset) => dataset.accessConditions.requiredDocuments.includes(documentId))
        .map((dataset) => dataset.acronym);
      findings.push({
        id: `MIS-02:${documentId}`,
        kind: "missing-information",
        severity: record?.status === "in-preparation" ? "advisory" : "attention",
        title: `${DOCUMENT_LABELS[documentId]} is not yet attached`,
        reason: `${requiredBy.join(", ")} require this document in the fictional catalogue. Its current status is "${
          record?.status ?? "not-started"
        }".`,
        suggestedAction:
          "Attach the document, or record a reference and expected date so the readiness view reflects real progress.",
        evidence: [
          `Required by: ${requiredBy.join(", ")}`,
          `Current status: ${record?.status ?? "not-started"}`,
        ],
        ruleId: "MIS-02",
        scope: { section: "governance", datasetIds: datasets.filter((dataset) => dataset.accessConditions.requiredDocuments.includes(documentId)).map((dataset) => dataset.id) },
        source: "deterministic-rules",
        confidence: 0.9,
      });
    }
  }

  /* MIS-03 — ambiguous phrasing ------------------------------------------- */
  const narrativeFields: { label: string; section: string; value: string }[] = [
    { label: "Research purpose", section: "purpose", value: application.researchPurpose },
    { label: "Population description", section: "scope", value: application.populationDescription },
    { label: "Analysis plan", section: "method", value: application.analysisPlan },
    { label: "Expected outputs", section: "outputs", value: application.expectedOutputs },
  ];
  for (const field of narrativeFields) {
    const hits = containsAny(field.value, AMBIGUOUS_PHRASES);
    if (hits.length > 0) {
      findings.push({
        id: `MIS-03:${field.label.toLowerCase().replace(/[^a-z]+/g, "-")}`,
        kind: "missing-information",
        severity: "advisory",
        title: `${field.label} contains open-ended phrasing`,
        reason: `The phrase${hits.length > 1 ? "s" : ""} ${hits
          .map((hit) => `"${hit}"`)
          .join(", ")} leave${hits.length > 1 ? "" : "s"} the scope undefined. A reviewer cannot assess a request whose boundary is not stated.`,
        suggestedAction: "Replace open-ended phrasing with an explicit list, or state the boundary in words.",
        evidence: hits.map((hit) => `Matched phrase: "${hit}"`),
        ruleId: "MIS-03",
        scope: { section: field.section },
        source: "deterministic-rules",
        confidence: 0.65,
      });
    }
  }

  if (datasets.length > 0) {
    const constraints = governingConstraints(datasets);
    const coverage = intersectCoverage(datasets);

    /* MIS-04 — duration beyond a dataset maximum -------------------------- */
    const months = typeof application.requestedAccessMonths === "number" ? application.requestedAccessMonths : 0;
    if (months > constraints.maximumAccessMonths) {
      const limiting = datasets.filter(
        (dataset) => dataset.accessConditions.maximumAccessMonths === constraints.maximumAccessMonths,
      );
      findings.push({
        id: "MIS-04:duration",
        kind: "missing-information",
        severity: "attention",
        title: `Requested access period exceeds what ${limiting.map((dataset) => dataset.acronym).join(", ")} permits`,
        reason: `You have requested ${months} months. The shortest maximum across the selected datasets is ${constraints.maximumAccessMonths} months.`,
        suggestedAction: `Reduce the request to ${constraints.maximumAccessMonths} months, or explain why an extension should be considered and how it would be reviewed.`,
        evidence: datasets.map(
          (dataset) => `${dataset.acronym}: maximum ${dataset.accessConditions.maximumAccessMonths} months`,
        ),
        ruleId: "MIS-04",
        scope: { section: "outputs", datasetIds: limiting.map((dataset) => dataset.id) },
        source: "deterministic-rules",
        confidence: 0.9,
      });
    }

    /* MIS-05 — study period outside coverage ------------------------------ */
    const start = Number.parseInt(application.timePeriod.start.slice(0, 4), 10);
    const end = Number.parseInt(application.timePeriod.end.slice(0, 4), 10);
    if (coverage.valid && Number.isFinite(start) && Number.isFinite(end)) {
      if (start < coverage.start || end > coverage.end) {
        findings.push({
          id: "MIS-05:period",
          kind: "missing-information",
          severity: "advisory",
          title: "The requested study period extends beyond shared coverage",
          reason: `You have requested ${start}–${end}, but every dataset in the project holds records only for ${coverage.start}–${coverage.end}. Outside that window at least one source contributes nothing.`,
          suggestedAction:
            "Narrow the study period to the shared window, or state which analyses use which sources in which years.",
          evidence: datasets.map(
            (dataset) => `${dataset.acronym}: ${dataset.timeCoverage.start}–${dataset.timeCoverage.end}`,
          ),
          ruleId: "MIS-05",
          scope: { section: "scope" },
          source: "deterministic-rules",
          confidence: 0.8,
        });
      }
    }

    /* MIS-06 — linkage requested where unsupported ------------------------ */
    if (application.linkageRequested) {
      const blockers = datasets.filter((dataset) => dataset.linkage.status === "No linkage supported");
      if (blockers.length > 0) {
        findings.push({
          id: "MIS-06:linkage",
          kind: "missing-information",
          severity: "attention",
          title: `Linkage is requested, but ${blockers.map((dataset) => dataset.acronym).join(", ")} supports none`,
          reason: `The application requests record-level linkage. ${blockers
            .map((dataset) => `${dataset.acronym} declares "${dataset.linkage.status}"`)
            .join("; ")}.`,
          suggestedAction:
            "Remove the dataset, drop the linkage requirement for that source, or confirm directly with the holder whether an exceptional route exists.",
          evidence: blockers.map((dataset) => `${dataset.acronym}: ${dataset.linkage.notes}`),
          ruleId: "MIS-06",
          scope: { section: "method", datasetIds: blockers.map((dataset) => dataset.id) },
          source: "deterministic-rules",
          confidence: 0.9,
        });
      }
      if (wordCount(application.linkageJustification) < 15) {
        findings.push({
          id: "MIS-06:linkage-justification",
          kind: "missing-information",
          severity: "advisory",
          title: "Linkage is requested without a substantive justification",
          reason:
            "Linkage materially increases both analytical power and re-identification risk, so it is assessed separately from the rest of the request.",
          suggestedAction:
            "State which research question requires linked records and why a design without linkage would not answer it.",
          evidence: [`Recorded justification: ${wordCount(application.linkageJustification)} word(s)`],
          ruleId: "MIS-06",
          scope: { section: "method" },
          source: "deterministic-rules",
          confidence: 0.75,
        });
      }
    }

    /* MIS-08 — dataset with no requested variables ------------------------ */
    for (const dataset of datasets) {
      const count = application.requestedVariables.filter(
        (requested) => requested.datasetId === dataset.id,
      ).length;
      if (count === 0) {
        findings.push({
          id: `MIS-08:${dataset.id}`,
          kind: "missing-information",
          severity: "advisory",
          title: `No variables have been requested from ${dataset.acronym}`,
          reason:
            "The dataset is in the project but contributes nothing to the request, which adds review burden, cost and a further access body without analytical benefit.",
          suggestedAction:
            "Select the variables you need from this dataset, or remove it from the project.",
          evidence: [
            `${dataset.acronym} is held by ${dataset.holder}`,
            `Assessed by ${dataset.accessBody.name}`,
          ],
          ruleId: "MIS-08",
          scope: { datasetIds: [dataset.id] },
          source: "deterministic-rules",
          confidence: 0.8,
        });
      }
    }
  }

  /* MIS-07 — attestations -------------------------------------------------- */
  const outstanding = (
    Object.keys(application.attestations) as (keyof ApplicationDraft["attestations"])[]
  ).filter((key) => !application.attestations[key]);
  if (outstanding.length > 0) {
    findings.push({
      id: "MIS-07:attestations",
      kind: "missing-information",
      severity: "attention",
      title: `${outstanding.length} attestation${outstanding.length > 1 ? "s" : ""} outstanding`,
      reason: "Attestations are recorded declarations. Most access processes will not accept a submission without them.",
      suggestedAction: "Review each statement and confirm it, or explain in the application why it cannot be given.",
      evidence: outstanding.map((key) => ATTESTATION_LABELS[key]),
      ruleId: "MIS-07",
      scope: { section: "governance" },
      source: "deterministic-rules",
      confidence: 0.95,
    });
  }

  return findings;
}
