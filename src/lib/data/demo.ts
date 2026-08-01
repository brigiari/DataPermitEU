import type { ApplicationDraft, AuditEntry, Project } from "@/lib/types";
import { emptyDocumentRecords } from "@/lib/data/documents";

/**
 * Demo content.
 *
 * The primary demo project follows a single research question — does poor
 * adherence to secondary-prevention medication predict cardiovascular
 * readmission — from dataset discovery through to a mock application that is
 * complete enough to review but deliberately imperfect, so the minimisation
 * and readiness features have something real to say.
 */

export function emptyApplication(): ApplicationDraft {
  return {
    researchPurpose: "",
    purposeCategory: "",
    publicInterestJustification: "",
    requestedVariables: [],
    populationDescription: "",
    timePeriod: { start: "", end: "" },
    estimatedCohortSize: "",
    analysisPlan: "",
    statisticalMethods: "",
    linkageRequested: false,
    linkageJustification: "",
    documents: emptyDocumentRecords(),
    legalBasisNote: "",
    ethicsNote: "",
    requestedAccessMonths: "",
    retentionPlan: "",
    expectedOutputs: "",
    outputDisclosureControls: "",
    dataDestructionPlan: "",
    attestations: {
      noReidentification: false,
      secureEnvironmentOnly: false,
      outputCheckingAccepted: false,
      guidanceIsEducational: false,
    },
  };
}

export function newProject(id: string, title: string, researchQuestion: string, now: string): Project {
  return {
    id,
    title,
    researchQuestion,
    principalInvestigator: "",
    institution: "",
    createdAt: now,
    updatedAt: now,
    datasetIds: [],
    application: emptyApplication(),
    status: "draft",
    auditTrail: [
      {
        id: `${id}-created`,
        timestamp: now,
        actor: "researcher",
        action: "Project created",
        detail: title,
      },
    ],
    reviewerNotes: [],
    dismissedRecommendations: [],
  };
}

const DEMO_CREATED = "2026-01-12T09:15:00.000Z";
const DEMO_UPDATED = "2026-02-18T16:42:00.000Z";

function audit(offsetDays: number, actor: AuditEntry["actor"], action: string, detail: string): AuditEntry {
  const base = new Date(DEMO_CREATED).getTime();
  const timestamp = new Date(base + offsetDays * 86_400_000).toISOString();
  return {
    id: `demo-audit-${offsetDays}-${action.toLowerCase().replace(/[^a-z]+/g, "-")}`,
    timestamp,
    actor,
    action,
    detail,
  };
}

const DEMO_APPLICATION: ApplicationDraft = {
  researchPurpose:
    "This study examines whether poor adherence to secondary-prevention medication in the twelve months following an acute coronary syndrome admission predicts unplanned cardiovascular readmission within two years. We will estimate the association between the proportion of days covered by statin, beta-blocker and antiplatelet therapy and time to first cardiovascular readmission, and describe how that association varies by age group, sex and index event type. The intention is to identify the adherence threshold at which readmission risk rises materially, so that follow-up services can be targeted where they change outcomes.",
  purposeCategory: "scientific-research",
  publicInterestJustification:
    "Unplanned cardiovascular readmission is distressing for patients and absorbs a large share of cardiology capacity. If a specific adherence threshold marks the point where readmission risk rises, health systems can concentrate pharmacist follow-up on the patients who benefit most rather than offering the same generic review to everyone. The direct beneficiaries are patients discharged after an acute coronary event; the secondary beneficiaries are the clinicians and services deciding where to place limited follow-up capacity. Results will be published openly and shared with the participating quality registers.",

  requestedVariables: [
    /* SCOR — index event and outcomes */
    {
      datasetId: "scor-se",
      variableId: "scor-pid",
      justification:
        "Required to join index admissions to dispensing records for the same person under the shared national pseudonymous key.",
      granularity: "as-published",
    },
    {
      datasetId: "scor-se",
      variableId: "scor-birthyear",
      justification: "Age at index event is a primary confounder in the readmission model and a pre-specified subgroup.",
      granularity: "as-published",
    },
    {
      datasetId: "scor-se",
      variableId: "scor-sex",
      justification: "Pre-specified subgroup and a confounder in the adjusted model.",
      granularity: "as-published",
    },
    {
      datasetId: "scor-se",
      variableId: "scor-indexdate",
      justification:
        "Defines the start of the twelve-month adherence exposure window and the origin for time-to-readmission.",
      granularity: "as-published",
    },
    {
      datasetId: "scor-se",
      variableId: "scor-indexdx",
      justification: "Index event type is a pre-specified effect modifier and defines cohort eligibility.",
      granularity: "as-published",
    },
    {
      datasetId: "scor-se",
      variableId: "scor-lvef",
      justification:
        "Ejection fraction is a strong independent predictor of readmission and is needed to avoid confounding by disease severity.",
      granularity: "as-published",
    },
    {
      datasetId: "scor-se",
      variableId: "scor-revasc",
      justification: "Revascularisation during the index episode alters both prescribing and readmission risk.",
      granularity: "as-published",
    },
    {
      datasetId: "scor-se",
      variableId: "scor-readmitdate",
      justification: "The primary outcome: time from discharge to first cardiovascular readmission.",
      granularity: "as-published",
    },
    {
      datasetId: "scor-se",
      variableId: "scor-readmitcause",
      justification:
        "Needed to distinguish cardiovascular readmissions from unrelated admissions in the primary outcome definition.",
      granularity: "as-published",
    },
    {
      datasetId: "scor-se",
      variableId: "scor-mortdate",
      justification: "Death is a competing risk and must be modelled explicitly rather than censored naively.",
      granularity: "as-published",
    },
    /* Deliberately imperfect entries — these are what the minimisation
       assistant is meant to surface during a walkthrough. */
    {
      datasetId: "scor-se",
      variableId: "scor-birthdate",
      justification: "Age",
      granularity: "as-published",
    },
    {
      datasetId: "scor-se",
      variableId: "scor-income",
      justification: "",
      granularity: "as-published",
    },
    {
      datasetId: "scor-se",
      variableId: "scor-postcode",
      justification: "May be useful for regional analysis.",
      granularity: "as-published",
    },

    /* SPDR — the exposure */
    {
      datasetId: "spdr-se",
      variableId: "spdr-pid",
      justification: "Join key to the index cohort under the shared national pseudonym.",
      granularity: "as-published",
    },
    {
      datasetId: "spdr-se",
      variableId: "spdr-atc",
      justification:
        "Identifies statin, beta-blocker and antiplatelet dispensings, which define the exposure of interest.",
      granularity: "as-published",
    },
    {
      datasetId: "spdr-se",
      variableId: "spdr-dispdate",
      justification: "Dispensing dates are required to compute proportion of days covered across the exposure window.",
      granularity: "as-published",
    },
    {
      datasetId: "spdr-se",
      variableId: "spdr-ddd",
      justification:
        "Quantity in defined daily doses is the denominator of the adherence calculation and cannot be derived otherwise.",
      granularity: "as-published",
    },
    {
      datasetId: "spdr-se",
      variableId: "spdr-prescriberid",
      justification: "Prescriber",
      granularity: "as-published",
    },
  ],

  populationDescription:
    "Adults aged 18 and over with a first recorded acute coronary syndrome admission in the Swedish cardiovascular register between 1 January 2015 and 31 December 2021, who survived at least 30 days after discharge and were resident in Sweden for the full twelve-month exposure window. Patients with a prior acute coronary syndrome admission in the five years before the index event are excluded.",
  timePeriod: { start: "2015-01-01", end: "2023-12-31" },
  estimatedCohortSize: "Approximately 180,000",

  analysisPlan:
    "We will construct a retrospective cohort with a twelve-month exposure window beginning at discharge from the index admission. Adherence will be expressed as the proportion of days covered for each of three therapeutic classes, derived from dispensing dates and defined daily doses using a published, versioned algorithm. Follow-up for the primary outcome begins at the end of the exposure window and continues to first cardiovascular readmission, death, emigration or 31 December 2023, whichever comes first. The primary analysis is a cause-specific Cox model with death treated as a competing risk, adjusted for age, sex, index event type, ejection fraction and revascularisation status. Adherence will be modelled both as a continuous variable using restricted cubic splines and in pre-specified bands, so that any threshold effect is visible rather than assumed. Sensitivity analyses will vary the exposure window to six and eighteen months, will apply a landmark analysis to address immortal-time bias, and will repeat the primary model excluding patients with a hospitalisation of more than 14 days during the exposure window, since inpatient administration is not captured in dispensing data.",
  statisticalMethods:
    "Cause-specific Cox proportional hazards regression with competing-risk handling, restricted cubic splines for the continuous exposure, Fine–Gray subdistribution models as a sensitivity analysis, and multiple imputation by chained equations for missing ejection fraction under a missing-at-random assumption. Proportional hazards will be assessed using scaled Schoenfeld residuals.",
  linkageRequested: true,
  linkageJustification:
    "The exposure and the outcome sit in different registers held by different organisations. Adherence can only be computed from individual dispensing histories, and readmission can only be observed in the cardiovascular register, so the study is impossible without record-level linkage between the two. Both holders declare the same national pseudonymous key and have completed joint releases before. No linkage to any third source is requested.",

  documents: [
    {
      id: "ethics-approval",
      status: "attached",
      reference: "FICTIONAL-ETH-2026-0431",
      note: "Approved by the (fictional) regional ethical review authority on 2026-01-28.",
    },
    {
      id: "study-protocol",
      status: "attached",
      reference: "PROT-ADH-CVD-v2.1",
      note: "Version 2.1 incorporates the landmark sensitivity analysis added after internal review.",
    },
    {
      id: "data-management-plan",
      status: "attached",
      reference: "DMP-ADH-CVD-v1.3",
      note: "Covers storage inside the secure processing environment, access logging and end-of-project handling.",
    },
    {
      id: "legal-basis-statement",
      status: "attached",
      reference: "LEG-2026-0092",
      note: "Prepared with the institution's data protection officer. Confirmation from each access body still required.",
    },
    {
      id: "institutional-authorisation",
      status: "in-preparation",
      reference: "",
      note: "Awaiting signature from the faculty research director; expected within two weeks.",
    },
    {
      id: "researcher-accreditation",
      status: "attached",
      reference: "ACC-SE-2025-1187",
      note: "Both named analysts completed the holder's accreditation module in November 2025.",
    },
    { id: "dpia", status: "in-preparation", reference: "", note: "Draft complete; awaiting DPO review." },
    { id: "publication-plan", status: "not-started", reference: "", note: "" },
    { id: "funding-declaration", status: "attached", reference: "FUND-2026-0037", note: "Public research council grant; no commercial funding." },
    { id: "conflict-of-interest", status: "attached", reference: "COI-2026-0037", note: "No declared interests for any named researcher." },
  ],
  legalBasisNote:
    "The institution's data protection officer has advised that the processing is intended to rely on the national provisions for scientific research applying to each register, supported by the ethical approval already granted. This description is the applicant's own understanding and requires confirmation from each access body and from the institution's legal advisers before submission.",
  ethicsNote:
    "Ethical approval covering the full study design was granted in January 2026 under reference FICTIONAL-ETH-2026-0431. The approval explicitly covers record-level linkage between the two Swedish registers and does not extend to any further linkage or to any contact with patients.",

  requestedAccessMonths: 30,
  retentionPlan:
    "Analytical datasets remain inside the secure processing environment for the duration of the permit. No record-level data is copied out at any point.",
  expectedOutputs:
    "Two peer-reviewed papers, the first reporting the primary adherence-readmission association and the second reporting the subgroup and threshold analyses. Aggregate results only: adjusted hazard ratios with confidence intervals, spline plots with no underlying point data, and descriptive tables where every cell meets the strictest applicable minimum count. A plain-language summary will be published alongside the first paper, and the analysis code will be released openly so the derivations can be checked.",
  outputDisclosureControls:
    "All outputs are prepared inside the secure processing environment and submitted to the holder's output-checking service before release. Cells below the strictest applicable threshold are suppressed, with secondary suppression applied so that suppressed cells cannot be recovered by subtraction. No individual-level data, model residuals or case-level plots will be requested for export.",
  dataDestructionPlan:
    "At the end of the access period the analytical datasets are deleted by the environment operator and a deletion confirmation is filed with each access body. Derived aggregate results already cleared by output checking are retained by the institution for ten years to support reproducibility, in line with the funder's policy.",

  attestations: {
    noReidentification: true,
    secureEnvironmentOnly: true,
    outputCheckingAccepted: true,
    guidanceIsEducational: true,
  },
};

export const DEMO_PROJECT: Project = {
  id: "demo-adherence-readmission",
  title: "Medication adherence and cardiovascular readmission",
  researchQuestion:
    "Does poor adherence to secondary-prevention medication in the year after an acute coronary syndrome admission predict unplanned cardiovascular readmission and mortality within two years, and is there an adherence threshold at which risk rises sharply?",
  principalInvestigator: "Dr Ilse Marchetti (fictional)",
  institution: "Northern European Institute of Population Health (fictional)",
  createdAt: DEMO_CREATED,
  updatedAt: DEMO_UPDATED,
  datasetIds: ["scor-se", "spdr-se", "finher-fi"],
  application: DEMO_APPLICATION,
  status: "internal-review",
  auditTrail: [
    audit(0, "researcher", "Project created", "Medication adherence and cardiovascular readmission"),
    audit(0, "researcher", "Research question recorded", "Adherence to secondary prevention and readmission risk"),
    audit(1, "system", "Relevance suggestions generated", "6 datasets scored against the research question by the deterministic rule set"),
    audit(1, "researcher", "Dataset added", "SCOR — Svea Cardiovascular Outcomes Register"),
    audit(1, "researcher", "Dataset added", "SPDR — Svea Pharmaceutical Dispensing Register"),
    audit(2, "system", "Compatibility check run", "Shared national pseudonymous key confirmed between SCOR and SPDR"),
    audit(4, "researcher", "Dataset added", "FINHER — Finnish Hospital Episode Repository (considering a replication cohort)"),
    audit(4, "system", "Compatibility check run", "Cross-border linkage between FINHER and the Swedish registers is not established"),
    audit(6, "researcher", "Variables selected", "18 variables requested across 2 datasets"),
    audit(9, "researcher", "Analysis plan drafted", "Cause-specific Cox model with competing risks"),
    audit(12, "system", "Data-minimisation review run", "5 findings raised for researcher review"),
    audit(16, "researcher", "Documents attached", "Ethics approval, protocol, data management plan, legal basis statement"),
    audit(23, "researcher", "Attestations confirmed", "All four attestations recorded"),
    audit(30, "researcher", "Sent for internal review", "Submitted to the institutional review group before external application"),
    audit(37, "reviewer", "Reviewer note added", "Query raised on the scope of socioeconomic variables"),
  ],
  reviewerNotes: [
    {
      id: "demo-note-1",
      timestamp: "2026-02-18T11:20:00.000Z",
      section: "scope",
      body: "Household income decile and full postcode are both requested with thin justification. Unless there is a planned inequalities analysis, I would drop both before this goes out — they will attract questions and they do not appear anywhere in the analysis plan.",
      decision: "clarification-requested",
    },
    {
      id: "demo-note-2",
      timestamp: "2026-02-18T11:34:00.000Z",
      section: "compatibility",
      body: "FINHER is in the project but no variables are requested from it, and cross-border linkage is not established. If the replication cohort is a serious plan it needs its own section in the protocol; otherwise remove the dataset so we are not opening a second jurisdiction for nothing.",
      decision: "clarification-requested",
    },
    {
      id: "demo-note-3",
      timestamp: "2026-02-18T11:52:00.000Z",
      section: "method",
      body: "Analysis plan is strong. The landmark analysis and the inpatient-stay exclusion address the two objections I expected to raise about dispensing-based adherence measures.",
      decision: "satisfied",
    },
  ],
  dismissedRecommendations: [],
};

/** A second project, deliberately early-stage, so the dashboard shows contrast. */
export const DEMO_PROJECT_EARLY: Project = {
  ...newProject(
    "demo-screening-equity",
    "Regional variation in cancer screening uptake",
    "How does uptake of population cancer screening vary across regions, and is the variation explained by area deprivation?",
    "2026-02-20T08:00:00.000Z",
  ),
  principalInvestigator: "Dr Tomás Ferreira (fictional)",
  institution: "Atlantic School of Public Health (fictional)",
  datasetIds: ["rror-de"],
  application: {
    ...emptyApplication(),
    researchPurpose:
      "We want to understand regional variation in cancer screening uptake and whether deprivation explains it.",
    purposeCategory: "public-health",
    publicInterestJustification: "Screening inequalities matter.",
  },
  auditTrail: [
    audit(39, "researcher", "Project created", "Regional variation in cancer screening uptake"),
    audit(39, "researcher", "Dataset added", "RROR — Rhein-Ruhr Oncology Registry"),
  ],
};

export const DEMO_PROJECTS: Project[] = [DEMO_PROJECT, DEMO_PROJECT_EARLY];
