import type { CodingSystem, Dataset, DatasetVariable } from "@/lib/types";
import { ACCESS_BODIES } from "@/lib/data/access-bodies";

/**
 * FICTIONAL DATASET CATALOGUE.
 *
 * Every dataset, holder, identifier, cohort size, quality score, access
 * condition and limitation below is invented for this prototype. Nothing here
 * describes a real registry, a real data holder, or a real access procedure.
 * Do not use any of it to plan an actual data-access application.
 */

type V = DatasetVariable;

function v(
  id: string,
  name: string,
  category: V["category"],
  sensitivity: V["sensitivity"],
  completeness: number,
  description: string,
  codingSystem?: CodingSystem,
  defaultGranularity?: string,
): V {
  return { id, name, category, sensitivity, completeness, description, codingSystem, defaultGranularity };
}

export const DATASETS: Dataset[] = [
  /* ---------------------------------------------------------------------- */
  {
    id: "scor-se",
    name: "Svea Cardiovascular Outcomes Register",
    acronym: "SCOR",
    holder: "Svea Institute for Circulatory Health (fictional)",
    country: "Sweden",
    accessBody: ACCESS_BODIES["hdab-se"],
    summary:
      "National quality register of acute coronary syndrome and heart-failure episodes with structured follow-up, procedure detail and linked readmission outcomes.",
    diseaseAreas: ["Cardiovascular", "Multi-morbidity"],
    dataCategories: ["Disease registry", "Hospital discharge records"],
    populations: ["Adults (18+)", "Older adults (65+)", "Chronic disease cohort"],
    timeCoverage: { start: 2005, end: "ongoing" },
    updateFrequency: "Quarterly",
    codingSystems: ["ICD-10", "SNOMED CT", "OMOP CDM v5.4"],
    approximateCohortSize: 1_240_000,
    accessComplexity: "Standard",
    linkage: {
      status: "National pseudonymous key available",
      knownLinkedDatasets: ["spdr-se"],
      notes:
        "A stable national pseudonymous key permits record-level linkage with other Swedish holders under a single permit. Cross-border linkage has not been attempted.",
    },
    variables: [
      v("scor-pid", "Pseudonymous person key", "identifier", "high", 100, "Stable national pseudonym; enables linkage within Swedish holders.", undefined, "Salted per project"),
      v("scor-birthdate", "Exact date of birth", "demographic", "direct-identifier", 100, "Full date of birth as recorded at registration.", undefined, "Released as birth year unless justified"),
      v("scor-birthyear", "Year of birth", "demographic", "moderate", 100, "Year component of date of birth."),
      v("scor-sex", "Sex recorded at registration", "demographic", "low", 99.8, "Administrative sex category."),
      v("scor-postcode", "Full residential postcode", "geographic", "high", 96.1, "Five-digit postcode of residence at index event.", undefined, "Released at NUTS-3 unless justified"),
      v("scor-region", "Region of residence (NUTS-2)", "geographic", "low", 99.4, "Regional health authority area."),
      v("scor-indexdate", "Index event date", "temporal", "moderate", 100, "Date of the qualifying cardiovascular admission."),
      v("scor-indexdx", "Index diagnosis", "clinical", "moderate", 99.2, "Primary diagnosis at the index admission.", "ICD-10"),
      v("scor-lvef", "Left ventricular ejection fraction", "clinical", "moderate", 78.4, "Echocardiographic LVEF nearest the index event."),
      v("scor-revasc", "Revascularisation procedure", "clinical", "moderate", 94.7, "PCI or CABG performed during the index episode.", "OPS/ICHI procedure codes"),
      v("scor-readmit30", "30-day all-cause readmission flag", "outcome", "low", 98.9, "Derived indicator of any inpatient readmission within 30 days."),
      v("scor-readmitdate", "Readmission date", "outcome", "moderate", 98.9, "Date of first readmission following discharge."),
      v("scor-readmitcause", "Readmission primary cause", "outcome", "moderate", 92.3, "Primary diagnosis recorded at readmission.", "ICD-10"),
      v("scor-mortdate", "Date of death", "outcome", "high", 99.9, "Date of death from the national mortality file."),
      v("scor-smoking", "Smoking status", "clinical", "moderate", 81.5, "Self-reported smoking status at registration."),
      v("scor-education", "Highest education level", "socioeconomic", "moderate", 88.0, "Three-band education classification."),
      v("scor-income", "Household disposable income decile", "socioeconomic", "high", 84.2, "Income decile from the national statistics linkage."),
    ],
    quality: {
      completeness: 94,
      timeliness: 82,
      interoperability: 88,
      consistency: 90,
      documentation: 92,
      notes: [
        "LVEF is missing for roughly one in five records before 2012.",
        "Procedure coding changed classification version in 2015; a mapping table is published.",
        "Socioeconomic variables originate from a statistics-office linkage and lag the clinical data by one year.",
      ],
    },
    provenance: {
      collectionMethod:
        "Mandatory structured reporting by treating cardiology units, reconciled quarterly against the national inpatient file.",
      legalBasisSummary:
        "Fictional national quality-register statute with a secondary-use provision. Educational description only — confirm the real basis with the relevant authority.",
      curationProcess:
        "Automated range and plausibility checks, duplicate resolution on the national key, and an annual manual audit of a 2% sample.",
      lastAudited: "2025-11-14",
      versioning: "Annual frozen releases (R2025.4 current) plus a rolling working extract.",
    },
    permittedPurposes: [
      "Scientific research on cardiovascular outcomes",
      "Health-system quality improvement",
      "Public-health surveillance",
      "Policy evaluation",
    ],
    prohibitedPurposes: [
      "Insurance risk rating or premium setting",
      "Employment screening",
      "Direct marketing of any product or service",
      "Re-identification of individuals by any means",
    ],
    accessConditions: {
      secureProcessingEnvironmentRequired: true,
      outputChecking: "Manual statistical disclosure control on every export; two-working-day turnaround.",
      minimumAggregationThreshold: 5,
      requiredDocuments: [
        "ethics-approval",
        "study-protocol",
        "data-management-plan",
        "legal-basis-statement",
        "institutional-authorisation",
        "researcher-accreditation",
      ],
      feeBand: "Cost recovery — moderate",
      maximumAccessMonths: 36,
    },
    knownLimitations: [
      "Coverage of primary-care-managed heart failure is incomplete before 2010.",
      "Patients treated outside the public system are systematically under-represented.",
      "Readmissions occurring abroad are not captured.",
    ],
    catalogueRef: "SE-CAT-0031",
    lastMetadataUpdate: "2026-01-19",
  },

  /* ---------------------------------------------------------------------- */
  {
    id: "spdr-se",
    name: "Svea Pharmaceutical Dispensing Register",
    acronym: "SPDR",
    holder: "Svea Medicines Agency (fictional)",
    country: "Sweden",
    accessBody: ACCESS_BODIES["hdab-se"],
    summary:
      "Complete record of outpatient pharmacy dispensing events including product, quantity, prescribed daily dose and dispensing date — the basis for adherence measures.",
    diseaseAreas: ["Cardiovascular", "Diabetes & Metabolic", "Mental Health", "Multi-morbidity"],
    dataCategories: ["Prescription & dispensing"],
    populations: ["General population", "Adults (18+)", "Older adults (65+)"],
    timeCoverage: { start: 2006, end: "ongoing" },
    updateFrequency: "Continuous",
    codingSystems: ["ATC", "OMOP CDM v5.4"],
    approximateCohortSize: 9_800_000,
    accessComplexity: "Standard",
    linkage: {
      status: "National pseudonymous key available",
      knownLinkedDatasets: ["scor-se"],
      notes:
        "Shares the national pseudonymous key with SCOR; the two holders have completed joint releases before, which shortens technical set-up.",
    },
    variables: [
      v("spdr-pid", "Pseudonymous person key", "identifier", "high", 100, "Same national pseudonym scheme used by SCOR."),
      v("spdr-birthyear", "Year of birth", "demographic", "moderate", 100, "Year of birth of the dispensed-to person."),
      v("spdr-sex", "Sex", "demographic", "low", 99.9, "Administrative sex category."),
      v("spdr-atc", "ATC code of dispensed product", "medication", "low", 100, "Anatomical Therapeutic Chemical code to level 5.", "ATC"),
      v("spdr-dispdate", "Dispensing date", "temporal", "moderate", 100, "Date the product was collected from the pharmacy."),
      v("spdr-ddd", "Defined daily doses dispensed", "medication", "low", 99.1, "Quantity expressed in DDD, the basis for adherence ratios."),
      v("spdr-packsize", "Pack size and strength", "medication", "low", 99.7, "Dispensed pack characteristics."),
      v("spdr-prescdose", "Prescribed daily dose", "medication", "low", 71.2, "Free-text-derived prescribed dose; parsed with a published algorithm."),
      v("spdr-prescriber", "Prescriber specialty", "administrative", "moderate", 93.4, "Specialty of the prescribing clinician."),
      v("spdr-prescriberid", "Prescriber identifier", "identifier", "direct-identifier", 100, "Individual professional registration number.", undefined, "Released as specialty only unless justified"),
      v("spdr-pharmacy", "Dispensing pharmacy identifier", "administrative", "high", 100, "Outlet identifier of the dispensing pharmacy.", undefined, "Released at municipality level unless justified"),
      v("spdr-reimb", "Reimbursement category", "administrative", "low", 98.8, "Cost-sharing band applied to the dispensing."),
      v("spdr-region", "Region of residence (NUTS-2)", "geographic", "low", 99.2, "Region of the dispensed-to person."),
    ],
    quality: {
      completeness: 97,
      timeliness: 95,
      interoperability: 91,
      consistency: 93,
      documentation: 88,
      notes: [
        "Prescribed daily dose is derived from free text and is missing for about 29% of records.",
        "In-hospital administration is out of scope; only outpatient dispensing is captured.",
        "Dispensing is a proxy for consumption, not evidence of ingestion.",
      ],
    },
    provenance: {
      collectionMethod:
        "Automatic transaction capture from every licensed outpatient pharmacy at the point of dispensing.",
      legalBasisSummary:
        "Fictional medicines-monitoring statute with a research provision. Educational description only.",
      curationProcess:
        "Nightly validation against the product registry, with reversal handling for cancelled transactions.",
      lastAudited: "2026-01-08",
      versioning: "Rolling extract with monthly snapshots retained for reproducibility.",
    },
    permittedPurposes: [
      "Pharmacoepidemiological research",
      "Medicines-safety surveillance",
      "Health-system quality improvement",
      "Policy evaluation",
    ],
    prohibitedPurposes: [
      "Commercial promotion or sales targeting of medicinal products",
      "Prescriber-level performance ranking for commercial use",
      "Insurance underwriting",
      "Re-identification of individuals or prescribers",
    ],
    accessConditions: {
      secureProcessingEnvironmentRequired: true,
      outputChecking: "Automated threshold screening followed by analyst review of flagged outputs.",
      minimumAggregationThreshold: 5,
      requiredDocuments: [
        "ethics-approval",
        "study-protocol",
        "data-management-plan",
        "legal-basis-statement",
        "researcher-accreditation",
      ],
      feeBand: "Cost recovery — low",
      maximumAccessMonths: 36,
    },
    knownLimitations: [
      "Over-the-counter purchases are not recorded.",
      "Dispensings during inpatient stays are absent, which can look like a treatment gap.",
      "Products dispensed abroad are missing entirely.",
    ],
    catalogueRef: "SE-CAT-0044",
    lastMetadataUpdate: "2026-02-02",
  },

  /* ---------------------------------------------------------------------- */
  {
    id: "finher-fi",
    name: "Finnish Hospital Episode Repository",
    acronym: "FINHER",
    holder: "National Institute for Care Analytics (fictional)",
    country: "Finland",
    accessBody: ACCESS_BODIES["hdab-fi"],
    summary:
      "Administrative record of every public inpatient and day-case episode, including admission source, diagnoses, procedures, length of stay and discharge destination.",
    diseaseAreas: ["Cardiovascular", "Respiratory", "Multi-morbidity", "Oncology"],
    dataCategories: ["Hospital discharge records"],
    populations: ["General population", "Hospitalised patients", "Older adults (65+)"],
    timeCoverage: { start: 1998, end: "ongoing" },
    updateFrequency: "Monthly",
    codingSystems: ["ICD-11", "SNOMED CT"],
    approximateCohortSize: 4_600_000,
    accessComplexity: "Standard",
    linkage: {
      status: "Project-specific linkage on request",
      knownLinkedDatasets: [],
      notes:
        "Linkage keys are generated per project by a trusted third party. Cross-border linkage requires a bilateral arrangement that has not yet been exercised.",
    },
    variables: [
      v("finher-pid", "Project-specific pseudonym", "identifier", "high", 100, "Generated per permit by a trusted third party."),
      v("finher-birthyear", "Year of birth", "demographic", "moderate", 100, "Year of birth."),
      v("finher-sex", "Sex", "demographic", "low", 100, "Administrative sex category."),
      v("finher-admdate", "Admission date", "temporal", "moderate", 100, "Date of admission to the episode."),
      v("finher-disdate", "Discharge date", "temporal", "moderate", 100, "Date of discharge."),
      v("finher-los", "Length of stay (days)", "administrative", "low", 100, "Derived length of the inpatient episode."),
      v("finher-primarydx", "Primary discharge diagnosis", "clinical", "moderate", 99.5, "Principal diagnosis coded in ICD-11.", "ICD-11"),
      v("finher-secondarydx", "Secondary diagnoses", "clinical", "moderate", 91.8, "Up to fifteen additional diagnoses.", "ICD-11"),
      v("finher-procedures", "Procedure codes", "clinical", "moderate", 96.2, "Procedures performed during the episode.", "OPS/ICHI procedure codes"),
      v("finher-admsource", "Admission source", "administrative", "low", 98.7, "Referral origin for the admission."),
      v("finher-disdest", "Discharge destination", "administrative", "low", 97.9, "Destination after discharge, including transfers."),
      v("finher-emergency", "Emergency admission flag", "administrative", "low", 100, "Whether the admission was unplanned."),
      v("finher-hospital", "Treating hospital identifier", "administrative", "moderate", 100, "Facility code of the treating unit."),
      v("finher-region", "Wellbeing services county", "geographic", "low", 99.6, "Administrative region of residence."),
    ],
    quality: {
      completeness: 96,
      timeliness: 88,
      interoperability: 74,
      consistency: 71,
      documentation: 85,
      notes: [
        "The repository migrated from ICD-10 to ICD-11 in 2023; series spanning that boundary need a crosswalk.",
        "Private-sector day cases are only partially reported before 2016.",
        "Secondary diagnosis depth varies by hospital, which affects comorbidity indices.",
      ],
    },
    provenance: {
      collectionMethod:
        "Statutory monthly submission from every public provider, validated against the national facility register.",
      legalBasisSummary:
        "Fictional statistics-and-research statute. Educational description only.",
      curationProcess:
        "Schema validation, episode-merging for intra-hospital transfers, and a published ICD-10 to ICD-11 crosswalk applied to historical records.",
      lastAudited: "2025-09-30",
      versioning: "Monthly increments; annual reference releases used for published statistics.",
    },
    permittedPurposes: [
      "Scientific research on care pathways and outcomes",
      "Health-system planning and capacity analysis",
      "Public-health surveillance",
      "Healthcare quality and safety evaluation",
    ],
    prohibitedPurposes: [
      "Provider-level league tables for commercial publication",
      "Insurance risk rating",
      "Any attempt to identify individuals or clinicians",
    ],
    accessConditions: {
      secureProcessingEnvironmentRequired: true,
      outputChecking: "Automated cell-suppression rules with analyst sign-off on model outputs.",
      minimumAggregationThreshold: 5,
      requiredDocuments: [
        "ethics-approval",
        "study-protocol",
        "data-management-plan",
        "dpia",
        "legal-basis-statement",
        "institutional-authorisation",
      ],
      feeBand: "Cost recovery — moderate",
      maximumAccessMonths: 24,
    },
    knownLimitations: [
      "Outpatient specialist contacts are out of scope.",
      "The 2023 terminology migration introduces a discontinuity in diagnosis-based cohort definitions.",
      "Cause-of-death information must be sourced separately.",
    ],
    catalogueRef: "FI-CAT-0112",
    lastMetadataUpdate: "2026-01-27",
  },

  /* ---------------------------------------------------------------------- */
  {
    id: "dandl-dk",
    name: "Danish National Dispensing Ledger",
    acronym: "DANDL",
    holder: "Danish Medicines Data Service (fictional)",
    country: "Denmark",
    accessBody: ACCESS_BODIES["hdab-dk"],
    summary:
      "High-frequency dispensing ledger with near-real-time updates, indication codes where recorded, and a well-documented adherence derivation toolkit.",
    diseaseAreas: ["Cardiovascular", "Diabetes & Metabolic", "Mental Health"],
    dataCategories: ["Prescription & dispensing"],
    populations: ["General population", "Adults (18+)", "Chronic disease cohort"],
    timeCoverage: { start: 2010, end: "ongoing" },
    updateFrequency: "Continuous",
    codingSystems: ["ATC", "SNOMED CT", "OMOP CDM v5.4"],
    approximateCohortSize: 5_900_000,
    accessComplexity: "Streamlined",
    linkage: {
      status: "National pseudonymous key available",
      knownLinkedDatasets: [],
      notes:
        "A national key supports linkage with other Danish holders. There is no key shared with holders in other member states.",
    },
    variables: [
      v("dandl-pid", "Pseudonymous person key", "identifier", "high", 100, "Danish national pseudonym."),
      v("dandl-birthyear", "Year of birth", "demographic", "moderate", 100, "Year of birth."),
      v("dandl-sex", "Sex", "demographic", "low", 100, "Administrative sex category."),
      v("dandl-atc", "ATC code", "medication", "low", 100, "Dispensed product to ATC level 5.", "ATC"),
      v("dandl-dispdate", "Dispensing date", "temporal", "moderate", 100, "Date of collection."),
      v("dandl-ddd", "Defined daily doses", "medication", "low", 99.8, "Quantity in DDD."),
      v("dandl-indication", "Recorded indication", "clinical", "moderate", 64.5, "Indication captured at prescribing, where entered.", "SNOMED CT"),
      v("dandl-adherence", "Pre-computed proportion of days covered", "medication", "low", 97.0, "Holder-derived PDC over rolling 12-month windows."),
      v("dandl-prescriber", "Prescriber specialty", "administrative", "moderate", 95.1, "Specialty of prescriber."),
      v("dandl-region", "Region of residence", "geographic", "low", 99.8, "Danish administrative region."),
      v("dandl-reimb", "Reimbursement status", "administrative", "low", 99.5, "Cost-sharing band."),
    ],
    quality: {
      completeness: 98,
      timeliness: 97,
      interoperability: 94,
      consistency: 95,
      documentation: 96,
      notes: [
        "Recorded indication is optional at prescribing and is present for roughly two thirds of records.",
        "A published, versioned adherence toolkit makes PDC and MPR derivations reproducible.",
      ],
    },
    provenance: {
      collectionMethod: "Real-time capture from the national prescription infrastructure.",
      legalBasisSummary:
        "Fictional health-data statute with an explicit secondary-use chapter. Educational description only.",
      curationProcess:
        "Continuous validation, versioned derivations, and a public data-quality dashboard updated weekly.",
      lastAudited: "2026-02-11",
      versioning: "Continuous with weekly immutable snapshots.",
    },
    permittedPurposes: [
      "Pharmacoepidemiological research",
      "Medicines-safety surveillance",
      "Health-economic evaluation",
      "Policy support",
    ],
    prohibitedPurposes: [
      "Marketing or commercial sales targeting",
      "Insurance underwriting",
      "Individual or prescriber re-identification",
    ],
    accessConditions: {
      secureProcessingEnvironmentRequired: true,
      outputChecking: "Automated disclosure screening; analyst review only for flagged exports.",
      minimumAggregationThreshold: 5,
      requiredDocuments: ["study-protocol", "data-management-plan", "legal-basis-statement", "researcher-accreditation"],
      feeBand: "Cost recovery — low",
      maximumAccessMonths: 48,
    },
    knownLimitations: [
      "Dispensing does not evidence ingestion.",
      "Inpatient administration is not captured.",
      "The pre-computed adherence measure uses a fixed assumption about dosing that may not suit every study.",
    ],
    catalogueRef: "DK-CAT-0009",
    lastMetadataUpdate: "2026-02-14",
  },

  /* ---------------------------------------------------------------------- */
  {
    id: "rror-de",
    name: "Rhein-Ruhr Oncology Registry",
    acronym: "RROR",
    holder: "Rhein-Ruhr Cancer Epidemiology Centre (fictional)",
    country: "Germany",
    accessBody: ACCESS_BODIES["hdab-de"],
    summary:
      "Population-based cancer registry covering incidence, staging, treatment modality and survival follow-up for a large industrial region.",
    diseaseAreas: ["Oncology"],
    dataCategories: ["Disease registry", "Mortality & vital statistics"],
    populations: ["General population", "Adults (18+)", "Older adults (65+)"],
    timeCoverage: { start: 1995, end: "ongoing" },
    updateFrequency: "Annual",
    codingSystems: ["ICD-10", "SNOMED CT", "Local proprietary codes"],
    approximateCohortSize: 2_100_000,
    accessComplexity: "Complex",
    linkage: {
      status: "Deterministic linkage within holder only",
      knownLinkedDatasets: [],
      notes:
        "Linkage is possible between this registry's own modules. External linkage requires a separate Länder-level authorisation and has a long lead time.",
    },
    variables: [
      v("rror-pid", "Registry case identifier", "identifier", "high", 100, "Internal case number, unique within the registry."),
      v("rror-birthyear", "Year of birth", "demographic", "moderate", 100, "Year of birth."),
      v("rror-sex", "Sex", "demographic", "low", 100, "Administrative sex category."),
      v("rror-dxdate", "Date of diagnosis", "temporal", "moderate", 99.8, "Incidence date per registry rules."),
      v("rror-topography", "Tumour topography", "clinical", "moderate", 99.9, "Anatomical site of the primary tumour.", "ICD-10"),
      v("rror-morphology", "Tumour morphology", "clinical", "moderate", 97.4, "Histological type.", "Local proprietary codes"),
      v("rror-stage", "Stage at diagnosis", "clinical", "moderate", 82.6, "Consolidated stage grouping."),
      v("rror-grade", "Tumour grade", "clinical", "moderate", 76.9, "Differentiation grade."),
      v("rror-firsttx", "First-line treatment modality", "clinical", "moderate", 88.1, "Surgery, radiotherapy, systemic therapy or combination."),
      v("rror-survival", "Survival time from diagnosis", "outcome", "moderate", 99.1, "Months from diagnosis to death or censoring."),
      v("rror-vitalstatus", "Vital status", "outcome", "moderate", 99.1, "Alive, deceased or lost to follow-up."),
      v("rror-causedeath", "Underlying cause of death", "outcome", "high", 94.3, "Cause of death from the regional mortality file.", "ICD-10"),
      v("rror-municipality", "Municipality of residence", "geographic", "high", 98.8, "Municipality at diagnosis.", undefined, "Released as district unless justified"),
      v("rror-occupation", "Recorded occupation", "socioeconomic", "high", 41.2, "Free-text occupation, sparsely completed and inconsistently coded."),
    ],
    quality: {
      completeness: 86,
      timeliness: 58,
      interoperability: 62,
      consistency: 79,
      documentation: 74,
      notes: [
        "Registration is considered complete only after a two-year consolidation window, so recent years under-count.",
        "Morphology uses a registry-specific coding scheme that requires a mapping file.",
        "Occupation is recorded for fewer than half of cases and should not be treated as a population measure.",
      ],
    },
    provenance: {
      collectionMethod:
        "Mandatory notification from clinicians, pathology laboratories and death certificates, consolidated by trained registrars.",
      legalBasisSummary:
        "Fictional Länder cancer-registry acts harmonised at federal level. Educational description only.",
      curationProcess:
        "Multi-source reconciliation, manual registrar review of ambiguous cases, and annual completeness estimation.",
      lastAudited: "2025-06-20",
      versioning: "Annual consolidated release (R2024 current, two-year lag).",
    },
    permittedPurposes: [
      "Cancer epidemiology research",
      "Survival and outcome analysis",
      "Public-health surveillance",
      "Screening-programme evaluation",
    ],
    prohibitedPurposes: [
      "Insurance risk assessment",
      "Employment or occupational screening",
      "Commercial patient recruitment",
      "Re-identification of individuals",
    ],
    accessConditions: {
      secureProcessingEnvironmentRequired: true,
      outputChecking: "Registrar-led manual review of all outputs; five-working-day turnaround.",
      minimumAggregationThreshold: 10,
      requiredDocuments: [
        "ethics-approval",
        "study-protocol",
        "data-management-plan",
        "dpia",
        "legal-basis-statement",
        "institutional-authorisation",
        "researcher-accreditation",
        "publication-plan",
      ],
      feeBand: "Cost recovery — high",
      maximumAccessMonths: 24,
    },
    knownLimitations: [
      "Regional rather than national coverage; results do not generalise to the whole country.",
      "The two-year consolidation lag makes the registry unsuitable for rapid surveillance.",
      "Treatment detail is limited to first-line modality with no dosing information.",
    ],
    catalogueRef: "DE-CAT-0207",
    lastMetadataUpdate: "2025-12-05",
  },

  /* ---------------------------------------------------------------------- */
  {
    id: "odsc-fr",
    name: "Occitanie Diabetes Surveillance Cohort",
    acronym: "ODSC",
    holder: "Occitanie Metabolic Health Observatory (fictional)",
    country: "France",
    accessBody: ACCESS_BODIES["hdab-fr"],
    summary:
      "Regional longitudinal cohort of people living with type 1 and type 2 diabetes, combining clinical measurements, complication events and care-process indicators.",
    diseaseAreas: ["Diabetes & Metabolic", "Cardiovascular", "Multi-morbidity"],
    dataCategories: ["Disease registry", "Laboratory results", "Primary care records"],
    populations: ["Adults (18+)", "Chronic disease cohort", "Older adults (65+)"],
    timeCoverage: { start: 2012, end: "ongoing" },
    updateFrequency: "Annual",
    codingSystems: ["ICD-10", "LOINC", "ATC"],
    approximateCohortSize: 310_000,
    accessComplexity: "Standard",
    linkage: {
      status: "Project-specific linkage on request",
      knownLinkedDatasets: ["ilre-es"],
      notes:
        "The observatory has participated in one prior multi-region linkage exercise using a trusted-third-party protocol.",
    },
    variables: [
      v("odsc-pid", "Cohort identifier", "identifier", "high", 100, "Study pseudonym issued at enrolment."),
      v("odsc-birthyear", "Year of birth", "demographic", "moderate", 100, "Year of birth."),
      v("odsc-sex", "Sex", "demographic", "low", 100, "Administrative sex category."),
      v("odsc-dmtype", "Diabetes type", "clinical", "moderate", 98.2, "Type 1, type 2 or other.", "ICD-10"),
      v("odsc-dxyear", "Year of diabetes diagnosis", "temporal", "moderate", 93.7, "Year of first recorded diagnosis."),
      v("odsc-hba1c", "HbA1c measurements", "laboratory", "moderate", 89.4, "Longitudinal HbA1c series with dates.", "LOINC"),
      v("odsc-egfr", "Estimated glomerular filtration rate", "laboratory", "moderate", 81.0, "Renal function series.", "LOINC"),
      v("odsc-ldl", "LDL cholesterol", "laboratory", "moderate", 78.3, "Lipid series.", "LOINC"),
      v("odsc-bmi", "Body mass index", "clinical", "moderate", 72.8, "Recorded at annual review."),
      v("odsc-bp", "Blood pressure", "clinical", "moderate", 85.6, "Systolic and diastolic at annual review."),
      v("odsc-glucmeds", "Glucose-lowering medication", "medication", "low", 95.9, "Current therapy class.", "ATC"),
      v("odsc-complications", "Recorded complications", "outcome", "moderate", 90.2, "Retinopathy, neuropathy, nephropathy and cardiovascular events.", "ICD-10"),
      v("odsc-hospevents", "Diabetes-related hospitalisations", "outcome", "moderate", 87.4, "Admissions with a diabetes-related principal diagnosis."),
      v("odsc-deprivation", "Area deprivation index", "socioeconomic", "moderate", 96.1, "Quintile of the regional deprivation score."),
      v("odsc-commune", "Commune of residence", "geographic", "high", 97.9, "Municipality of residence.", undefined, "Released at département level unless justified"),
    ],
    quality: {
      completeness: 84,
      timeliness: 66,
      interoperability: 79,
      consistency: 77,
      documentation: 81,
      notes: [
        "Laboratory series depend on participating laboratories; coverage is stronger in urban areas.",
        "BMI and blood pressure come from annual reviews and are missing where a review was not attended.",
        "Complication ascertainment improved noticeably after a 2018 protocol change.",
      ],
    },
    provenance: {
      collectionMethod:
        "Consented enrolment through participating primary-care practices with annual structured follow-up and laboratory feeds.",
      legalBasisSummary:
        "Fictional regional research-cohort framework with participant consent. Educational description only.",
      curationProcess:
        "Unit harmonisation for laboratory values, outlier review, and annual data-quality reporting to participating practices.",
      lastAudited: "2025-10-02",
      versioning: "Annual releases (V2025 current).",
    },
    permittedPurposes: [
      "Diabetes and metabolic research",
      "Care-quality evaluation",
      "Health-services research",
      "Public-health surveillance",
    ],
    prohibitedPurposes: [
      "Insurance or credit assessment",
      "Commercial product targeting",
      "Any purpose outside the consent given at enrolment",
      "Re-identification of participants",
    ],
    accessConditions: {
      secureProcessingEnvironmentRequired: true,
      outputChecking: "Manual review with a documented appeal route.",
      minimumAggregationThreshold: 5,
      requiredDocuments: [
        "ethics-approval",
        "study-protocol",
        "data-management-plan",
        "dpia",
        "legal-basis-statement",
        "institutional-authorisation",
      ],
      feeBand: "Cost recovery — moderate",
      maximumAccessMonths: 30,
    },
    knownLimitations: [
      "Consent-based enrolment introduces participation bias toward engaged patients.",
      "Regional coverage only.",
      "People diagnosed before 2012 have incomplete diagnosis-date information.",
    ],
    catalogueRef: "FR-CAT-0058",
    lastMetadataUpdate: "2025-12-18",
  },

  /* ---------------------------------------------------------------------- */
  {
    id: "lmhp-it",
    name: "Lombardia Mental Health Pathways Dataset",
    acronym: "LMHP",
    holder: "Lombardia Regional Mental Health Observatory (fictional)",
    country: "Italy",
    accessBody: ACCESS_BODIES["hdab-it"],
    summary:
      "Service-contact dataset describing community and inpatient mental-health pathways, treatment episodes, and continuity-of-care indicators.",
    diseaseAreas: ["Mental Health", "Multi-morbidity"],
    dataCategories: ["Disease registry", "Hospital discharge records", "Primary care records"],
    populations: ["Adults (18+)", "Paediatric", "Chronic disease cohort"],
    timeCoverage: { start: 2014, end: "ongoing" },
    updateFrequency: "Quarterly",
    codingSystems: ["ICD-10", "Local proprietary codes"],
    approximateCohortSize: 480_000,
    accessComplexity: "Complex",
    linkage: {
      status: "No linkage supported",
      knownLinkedDatasets: [],
      notes:
        "The regional authority does not currently release linkage keys for mental-health data. Record-level linkage with any other dataset is not available.",
    },
    variables: [
      v("lmhp-pid", "Service pseudonym", "identifier", "high", 100, "Pseudonym scoped to this dataset only; no external linkage."),
      v("lmhp-birthyear", "Year of birth", "demographic", "moderate", 100, "Year of birth."),
      v("lmhp-agegroup", "Age group", "demographic", "low", 100, "Five-year age bands."),
      v("lmhp-sex", "Sex", "demographic", "low", 99.7, "Administrative sex category."),
      v("lmhp-firstcontact", "Date of first service contact", "temporal", "moderate", 98.4, "Entry point into the mental-health pathway."),
      v("lmhp-diagnosis", "Primary diagnosis", "clinical", "high", 94.1, "Principal mental-health diagnosis.", "ICD-10"),
      v("lmhp-contacts", "Service contact count", "administrative", "low", 100, "Number of contacts per quarter by contact type."),
      v("lmhp-contacttype", "Contact modality", "administrative", "low", 99.2, "Community, outpatient, day-care or inpatient.", "Local proprietary codes"),
      v("lmhp-admission", "Inpatient admissions", "outcome", "moderate", 97.6, "Psychiatric inpatient episodes with dates."),
      v("lmhp-compulsory", "Compulsory treatment order", "clinical", "high", 96.0, "Whether treatment was delivered under a compulsory order."),
      v("lmhp-continuity", "Continuity-of-care indicator", "outcome", "low", 92.3, "Derived indicator of follow-up within 14 days of discharge."),
      v("lmhp-employment", "Employment status", "socioeconomic", "high", 58.7, "Recorded at assessment; sparsely completed."),
      v("lmhp-housing", "Housing situation", "socioeconomic", "high", 54.2, "Recorded at assessment; sparsely completed."),
      v("lmhp-asl", "Local health authority area", "geographic", "moderate", 100, "Sub-regional service area."),
    ],
    quality: {
      completeness: 78,
      timeliness: 74,
      interoperability: 55,
      consistency: 68,
      documentation: 66,
      notes: [
        "Contact modality uses a regional code list with no published international mapping.",
        "Social variables are optional at assessment and are missing for a large minority of records.",
        "Service reorganisation in 2019 changed how community contacts are counted.",
      ],
    },
    provenance: {
      collectionMethod:
        "Quarterly extraction from regional mental-health service information systems.",
      legalBasisSummary:
        "Fictional regional health-information regulation with heightened safeguards for mental-health data. Educational description only.",
      curationProcess:
        "Service-level validation with a regional reconciliation step; limited historical back-correction.",
      lastAudited: "2025-04-17",
      versioning: "Quarterly releases without retrospective restatement.",
    },
    permittedPurposes: [
      "Mental-health services research",
      "Care-pathway and continuity evaluation",
      "Regional planning",
      "Public-health surveillance",
    ],
    prohibitedPurposes: [
      "Any employment, insurance or credit-related use",
      "Individual-level profiling or risk scoring of identifiable people",
      "Commercial use of any kind",
      "Re-identification of service users",
    ],
    accessConditions: {
      secureProcessingEnvironmentRequired: true,
      outputChecking: "Two-stage review including a clinical governance representative; ten-working-day turnaround.",
      minimumAggregationThreshold: 10,
      requiredDocuments: [
        "ethics-approval",
        "study-protocol",
        "data-management-plan",
        "dpia",
        "legal-basis-statement",
        "institutional-authorisation",
        "researcher-accreditation",
        "publication-plan",
        "conflict-of-interest",
      ],
      feeBand: "Cost recovery — high",
      maximumAccessMonths: 18,
    },
    knownLimitations: [
      "Private-sector and voluntary-sector care is not captured.",
      "The absence of linkage keys prevents any combined analysis with physical-health data.",
      "The 2019 counting change breaks comparability across that boundary.",
    ],
    catalogueRef: "IT-CAT-0143",
    lastMetadataUpdate: "2025-11-22",
  },

  /* ---------------------------------------------------------------------- */
  {
    id: "ilre-es",
    name: "Iberian Laboratory Results Exchange",
    acronym: "ILRE",
    holder: "Iberian Clinical Laboratory Network (fictional)",
    country: "Spain",
    accessBody: ACCESS_BODIES["hdab-es"],
    summary:
      "Consolidated laboratory result repository spanning participating hospital and community laboratories, fully coded to LOINC with harmonised units.",
    diseaseAreas: ["Diabetes & Metabolic", "Cardiovascular", "Infectious Disease", "Multi-morbidity"],
    dataCategories: ["Laboratory results"],
    populations: ["General population", "Adults (18+)", "Hospitalised patients"],
    timeCoverage: { start: 2016, end: "ongoing" },
    updateFrequency: "Monthly",
    codingSystems: ["LOINC", "SNOMED CT", "OMOP CDM v5.4"],
    approximateCohortSize: 6_200_000,
    accessComplexity: "Standard",
    linkage: {
      status: "Project-specific linkage on request",
      knownLinkedDatasets: ["odsc-fr"],
      notes:
        "Linkage is brokered by a trusted third party. One prior cross-border exercise was completed with a French regional cohort.",
    },
    variables: [
      v("ilre-pid", "Project pseudonym", "identifier", "high", 100, "Issued per permit by the linkage broker."),
      v("ilre-birthyear", "Year of birth", "demographic", "moderate", 99.9, "Year of birth."),
      v("ilre-sex", "Sex", "demographic", "low", 99.9, "Administrative sex category."),
      v("ilre-loinc", "Test code", "laboratory", "low", 100, "LOINC-coded analyte.", "LOINC"),
      v("ilre-value", "Result value", "laboratory", "moderate", 99.6, "Numeric result in harmonised units."),
      v("ilre-unit", "Result unit", "laboratory", "low", 99.6, "SI unit after harmonisation."),
      v("ilre-refrange", "Reference range", "laboratory", "low", 94.8, "Laboratory reference interval applied."),
      v("ilre-collected", "Specimen collection datetime", "temporal", "moderate", 98.9, "Date and time of collection."),
      v("ilre-setting", "Requesting setting", "administrative", "low", 97.2, "Primary care, outpatient or inpatient."),
      v("ilre-lab", "Performing laboratory", "administrative", "moderate", 100, "Laboratory identifier."),
      v("ilre-abnormal", "Abnormality flag", "laboratory", "low", 99.1, "Derived indicator relative to the reference range."),
      v("ilre-province", "Province of the requesting unit", "geographic", "moderate", 99.4, "Administrative province."),
    ],
    quality: {
      completeness: 92,
      timeliness: 86,
      interoperability: 96,
      consistency: 88,
      documentation: 90,
      notes: [
        "Unit harmonisation is applied at ingestion with a published mapping table.",
        "Participation grew over time; earlier years cover fewer laboratories.",
        "Free-text microbiology comments are excluded from release.",
      ],
    },
    provenance: {
      collectionMethod:
        "Automated HL7 feeds from participating laboratories, mapped to LOINC at ingestion.",
      legalBasisSummary:
        "Fictional national health-information framework with autonomous-community sign-off. Educational description only.",
      curationProcess:
        "Terminology mapping with manual review of unmapped codes, unit conversion, and monthly mapping-coverage reporting.",
      lastAudited: "2026-01-30",
      versioning: "Monthly increments with a versioned terminology map.",
    },
    permittedPurposes: [
      "Clinical epidemiology and diagnostics research",
      "Care-quality evaluation",
      "Public-health surveillance",
      "Health-services research",
    ],
    prohibitedPurposes: [
      "Insurance underwriting or risk rating",
      "Commercial diagnostic-product marketing",
      "Re-identification of individuals or laboratories",
    ],
    accessConditions: {
      secureProcessingEnvironmentRequired: true,
      outputChecking: "Automated screening with analyst review of model coefficients and small-cell outputs.",
      minimumAggregationThreshold: 5,
      requiredDocuments: [
        "ethics-approval",
        "study-protocol",
        "data-management-plan",
        "legal-basis-statement",
        "institutional-authorisation",
      ],
      feeBand: "Cost recovery — moderate",
      maximumAccessMonths: 24,
    },
    knownLimitations: [
      "Coverage reflects participating laboratories rather than the whole population.",
      "Point-of-care testing is largely absent.",
      "A result exists only where a test was ordered, which is informative missingness.",
    ],
    catalogueRef: "ES-CAT-0076",
    lastMetadataUpdate: "2026-02-05",
  },

  /* ---------------------------------------------------------------------- */
  {
    id: "rpcc-nl",
    name: "Randstad Primary Care Cohort",
    acronym: "RPCC",
    holder: "Randstad Academic Primary Care Network (fictional)",
    country: "Netherlands",
    accessBody: ACCESS_BODIES["hdab-nl"],
    summary:
      "Longitudinal primary-care record extract from participating general practices, covering consultations, episodes of care, prescribing and referrals.",
    diseaseAreas: ["Multi-morbidity", "Cardiovascular", "Mental Health", "Respiratory"],
    dataCategories: ["Primary care records", "Prescription & dispensing"],
    populations: ["General population", "Adults (18+)", "Paediatric", "Pregnant persons"],
    timeCoverage: { start: 2008, end: "ongoing" },
    updateFrequency: "Quarterly",
    codingSystems: ["ICPC-2", "ATC", "OMOP CDM v5.4"],
    approximateCohortSize: 1_750_000,
    accessComplexity: "Standard",
    linkage: {
      status: "National pseudonymous key available",
      knownLinkedDatasets: [],
      notes:
        "A national pseudonym supports linkage with other Dutch holders under a joint permit.",
    },
    variables: [
      v("rpcc-pid", "Pseudonymous person key", "identifier", "high", 100, "National pseudonym."),
      v("rpcc-birthyear", "Year of birth", "demographic", "moderate", 100, "Year of birth."),
      v("rpcc-sex", "Sex", "demographic", "low", 100, "Administrative sex category."),
      v("rpcc-episode", "Episode of care", "clinical", "moderate", 96.3, "ICPC-2 coded episode with start and end dates.", "ICPC-2"),
      v("rpcc-consult", "Consultation records", "administrative", "moderate", 99.1, "Date, modality and duration of contacts."),
      v("rpcc-prescription", "Primary-care prescriptions", "medication", "low", 98.4, "Prescribed products.", "ATC"),
      v("rpcc-referral", "Referrals to secondary care", "administrative", "moderate", 94.7, "Referral date and receiving specialty."),
      v("rpcc-measurements", "Practice measurements", "clinical", "moderate", 73.5, "Blood pressure, weight and smoking recorded opportunistically."),
      v("rpcc-labresults", "Primary-care laboratory results", "laboratory", "moderate", 68.9, "Results ordered by the practice.", "LOINC"),
      v("rpcc-practice", "Practice identifier", "administrative", "moderate", 100, "Participating practice code."),
      v("rpcc-urbanicity", "Urbanicity band", "geographic", "low", 99.8, "Five-band urbanisation classification."),
      v("rpcc-ses", "Neighbourhood socioeconomic score", "socioeconomic", "moderate", 97.2, "Area-level score, not individual."),
      v("rpcc-freetext", "Consultation free text", "clinical", "direct-identifier", 88.0, "Unstructured clinician notes; may contain identifying detail.", undefined, "Not released; structured codes only"),
    ],
    quality: {
      completeness: 88,
      timeliness: 84,
      interoperability: 83,
      consistency: 85,
      documentation: 87,
      notes: [
        "Measurements are recorded opportunistically, so absence does not imply a normal value.",
        "Practices join and leave the network, producing an open cohort with variable follow-up.",
        "Free-text notes are excluded from every release by default.",
      ],
    },
    provenance: {
      collectionMethod:
        "Quarterly automated extraction from participating practice systems under a network data-sharing agreement.",
      legalBasisSummary:
        "Fictional national framework with a practice-level agreement and patient opt-out. Educational description only.",
      curationProcess:
        "Coding harmonisation across practice systems, opt-out enforcement, and per-practice quality reporting.",
      lastAudited: "2025-12-11",
      versioning: "Quarterly releases with a stable historical base.",
    },
    permittedPurposes: [
      "Primary-care and health-services research",
      "Multi-morbidity and care-pathway research",
      "Public-health surveillance",
      "Care-quality evaluation",
    ],
    prohibitedPurposes: [
      "Practice-level performance ranking for commercial use",
      "Insurance underwriting",
      "Patient recruitment without a separate approval",
      "Re-identification of patients or practices",
    ],
    accessConditions: {
      secureProcessingEnvironmentRequired: true,
      outputChecking: "Automated screening plus review by the network's data steward.",
      minimumAggregationThreshold: 5,
      requiredDocuments: [
        "ethics-approval",
        "study-protocol",
        "data-management-plan",
        "legal-basis-statement",
        "institutional-authorisation",
        "publication-plan",
      ],
      feeBand: "Cost recovery — moderate",
      maximumAccessMonths: 36,
    },
    knownLimitations: [
      "Participating practices are not a random sample of the country.",
      "Secondary-care outcomes are visible only as referrals, not as results.",
      "Patient opt-outs remove records without a recorded reason.",
    ],
    catalogueRef: "NL-CAT-0064",
    lastMetadataUpdate: "2026-01-11",
  },

  /* ---------------------------------------------------------------------- */
  {
    id: "bdhlr-ee",
    name: "Baltic Digital Health Longitudinal Record",
    acronym: "BDHLR",
    holder: "Estonian Digital Health Foundation (fictional)",
    country: "Estonia",
    accessBody: ACCESS_BODIES["hdab-ee"],
    summary:
      "Near-complete national longitudinal health record covering encounters, diagnoses, prescriptions and laboratory results in a single harmonised model.",
    diseaseAreas: [
      "Multi-morbidity",
      "Cardiovascular",
      "Diabetes & Metabolic",
      "Mental Health",
      "Infectious Disease",
    ],
    dataCategories: [
      "Primary care records",
      "Hospital discharge records",
      "Prescription & dispensing",
      "Laboratory results",
    ],
    populations: ["General population", "Adults (18+)", "Paediatric", "Older adults (65+)"],
    timeCoverage: { start: 2009, end: "ongoing" },
    updateFrequency: "Continuous",
    codingSystems: ["SNOMED CT", "ATC", "LOINC", "ICD-10", "OMOP CDM v5.4"],
    approximateCohortSize: 1_320_000,
    accessComplexity: "Streamlined",
    linkage: {
      status: "National pseudonymous key available",
      knownLinkedDatasets: [],
      notes:
        "All domains already share one internal key, so most studies need no additional linkage step.",
    },
    variables: [
      v("bdhlr-pid", "National pseudonymous key", "identifier", "high", 100, "Single key across all domains."),
      v("bdhlr-birthyear", "Year of birth", "demographic", "moderate", 100, "Year of birth."),
      v("bdhlr-sex", "Sex", "demographic", "low", 100, "Administrative sex category."),
      v("bdhlr-encounters", "Care encounters", "administrative", "low", 99.7, "All recorded encounters with setting and date."),
      v("bdhlr-diagnoses", "Diagnoses", "clinical", "moderate", 98.8, "Coded diagnoses across settings.", "SNOMED CT"),
      v("bdhlr-prescriptions", "Prescriptions and dispensings", "medication", "low", 99.2, "Prescribed and dispensed products.", "ATC"),
      v("bdhlr-labs", "Laboratory results", "laboratory", "moderate", 95.4, "Coded results with units.", "LOINC"),
      v("bdhlr-procedures", "Procedures", "clinical", "moderate", 96.7, "Coded procedures.", "SNOMED CT"),
      v("bdhlr-vitalstatus", "Vital status and date of death", "outcome", "high", 99.9, "From the population register."),
      v("bdhlr-county", "County of residence", "geographic", "low", 99.9, "Administrative county."),
      v("bdhlr-nationality", "Recorded nationality", "demographic", "high", 98.2, "Population-register nationality field."),
      v("bdhlr-incomeband", "Income band", "socioeconomic", "high", 91.3, "Banded income from the tax linkage."),
    ],
    quality: {
      completeness: 96,
      timeliness: 96,
      interoperability: 97,
      consistency: 92,
      documentation: 94,
      notes: [
        "One of the most interoperable datasets in this fictional catalogue; SNOMED CT and LOINC native.",
        "Small national population limits statistical power for rare outcomes.",
        "Income banding is derived annually and lags clinical data.",
      ],
    },
    provenance: {
      collectionMethod:
        "Continuous ingestion from the national digital health infrastructure, to which all providers report.",
      legalBasisSummary:
        "Fictional national digital-health act with an explicit secondary-use chapter. Educational description only.",
      curationProcess:
        "Native terminology capture, continuous validation, and public quality metrics per domain.",
      lastAudited: "2026-02-09",
      versioning: "Continuous with daily immutable snapshots.",
    },
    permittedPurposes: [
      "Scientific research across clinical areas",
      "Public-health surveillance",
      "Health-system evaluation",
      "Innovation and development under additional conditions",
    ],
    prohibitedPurposes: [
      "Insurance underwriting",
      "Employment screening",
      "Advertising or commercial targeting",
      "Re-identification of individuals",
    ],
    accessConditions: {
      secureProcessingEnvironmentRequired: true,
      outputChecking: "Automated disclosure control with a documented appeal path; one-working-day turnaround.",
      minimumAggregationThreshold: 5,
      requiredDocuments: ["study-protocol", "data-management-plan", "legal-basis-statement", "researcher-accreditation"],
      feeBand: "Cost recovery — low",
      maximumAccessMonths: 48,
    },
    knownLimitations: [
      "A small national population constrains subgroup and rare-event analyses.",
      "Care received abroad is not captured.",
      "The small population raises disclosure risk, so output checking is strict.",
    ],
    catalogueRef: "EE-CAT-0012",
    lastMetadataUpdate: "2026-02-16",
  },

  /* ---------------------------------------------------------------------- */
  {
    id: "vhda-pl",
    name: "Vistula Hospital Discharge Archive",
    acronym: "VHDA",
    holder: "Vistula Hospital Statistics Bureau (fictional)",
    country: "Poland",
    accessBody: ACCESS_BODIES["hdab-pl"],
    summary:
      "Long-running archive of inpatient discharge summaries with deep historical coverage but legacy coding, sparse documentation and a manual release process.",
    diseaseAreas: ["Cardiovascular", "Respiratory", "Oncology", "Multi-morbidity"],
    dataCategories: ["Hospital discharge records"],
    populations: ["General population", "Hospitalised patients", "Adults (18+)"],
    timeCoverage: { start: 1992, end: 2024 },
    updateFrequency: "Irregular",
    codingSystems: ["ICD-10", "Local proprietary codes"],
    approximateCohortSize: 3_400_000,
    accessComplexity: "Complex",
    linkage: {
      status: "No linkage supported",
      knownLinkedDatasets: [],
      notes:
        "No persistent person key exists in the archive. Repeat admissions by the same person cannot be reliably connected.",
    },
    variables: [
      v("vhda-recordid", "Discharge record identifier", "identifier", "moderate", 100, "Episode-level identifier; not stable across admissions."),
      v("vhda-birthyear", "Year of birth", "demographic", "moderate", 97.8, "Year of birth where recorded."),
      v("vhda-sex", "Sex", "demographic", "low", 99.1, "Administrative sex category."),
      v("vhda-admdate", "Admission date", "temporal", "moderate", 99.7, "Date of admission."),
      v("vhda-disdate", "Discharge date", "temporal", "moderate", 99.5, "Date of discharge."),
      v("vhda-primarydx", "Primary diagnosis", "clinical", "moderate", 96.4, "Principal diagnosis.", "ICD-10"),
      v("vhda-secondarydx", "Secondary diagnoses", "clinical", "moderate", 61.2, "Additional diagnoses, inconsistently completed.", "ICD-10"),
      v("vhda-procedure", "Procedure", "clinical", "moderate", 58.9, "Legacy national procedure codes with no published crosswalk.", "Local proprietary codes"),
      v("vhda-ward", "Discharging ward type", "administrative", "low", 93.7, "Ward classification."),
      v("vhda-outcome", "Discharge outcome", "outcome", "moderate", 95.8, "Discharged, transferred or died in hospital."),
      v("vhda-voivodeship", "Voivodeship of the hospital", "geographic", "low", 100, "Administrative region of the treating hospital."),
    ],
    quality: {
      completeness: 71,
      timeliness: 34,
      interoperability: 38,
      consistency: 52,
      documentation: 44,
      notes: [
        "Procedure coding uses a legacy national scheme with no published mapping to international terminologies.",
        "Secondary diagnoses are completed for roughly six in ten records, and completion varies sharply by hospital.",
        "The archive closed to new records in 2024 and is no longer updated.",
      ],
    },
    provenance: {
      collectionMethod:
        "Paper discharge summaries digitised in batches until 2008, then electronic submission of variable quality.",
      legalBasisSummary:
        "Fictional legacy statistical-reporting regulation. Educational description only.",
      curationProcess:
        "Limited historical curation; digitisation-era records retain transcription errors that were never systematically corrected.",
      lastAudited: "2022-03-15",
      versioning: "A single closed archive release; no ongoing versioning.",
    },
    permittedPurposes: [
      "Historical epidemiological research",
      "Long-run health-system analysis",
      "Methodological research on administrative data",
    ],
    prohibitedPurposes: [
      "Any use implying current clinical practice",
      "Insurance or employment assessment",
      "Re-identification of individuals",
    ],
    accessConditions: {
      secureProcessingEnvironmentRequired: false,
      outputChecking: "Manual review by bureau staff; turnaround is not guaranteed.",
      minimumAggregationThreshold: 10,
      requiredDocuments: [
        "study-protocol",
        "data-management-plan",
        "legal-basis-statement",
        "institutional-authorisation",
        "ethics-approval",
        "dpia",
      ],
      feeBand: "Cost recovery — high",
      maximumAccessMonths: 12,
    },
    knownLimitations: [
      "No person-level identifier, so readmission and longitudinal analyses are impossible.",
      "Data ends in 2024 with no plan to extend it.",
      "Documentation of pre-2008 digitisation practice is largely lost.",
    ],
    catalogueRef: "PL-CAT-0301",
    lastMetadataUpdate: "2025-05-08",
  },

  /* ---------------------------------------------------------------------- */
  {
    id: "aprop-pt",
    name: "Atlantic Patient-Reported Outcomes Panel",
    acronym: "APROP",
    holder: "Atlantic Institute for Person-Centred Care (fictional)",
    country: "Portugal",
    accessBody: ACCESS_BODIES["hdab-pt"],
    summary:
      "Repeated-measures panel of validated patient-reported outcome and experience instruments collected from consenting participants across chronic conditions.",
    diseaseAreas: ["Cardiovascular", "Diabetes & Metabolic", "Mental Health", "Oncology"],
    dataCategories: ["Patient-reported outcomes"],
    populations: ["Adults (18+)", "Chronic disease cohort", "Older adults (65+)"],
    timeCoverage: { start: 2018, end: "ongoing" },
    updateFrequency: "Quarterly",
    codingSystems: ["SNOMED CT", "Local proprietary codes"],
    approximateCohortSize: 92_000,
    accessComplexity: "Standard",
    linkage: {
      status: "Project-specific linkage on request",
      knownLinkedDatasets: [],
      notes:
        "Participants consented to linkage with national health records; each linkage still requires a specific approval.",
    },
    variables: [
      v("aprop-pid", "Panel participant identifier", "identifier", "high", 100, "Study pseudonym."),
      v("aprop-birthyear", "Year of birth", "demographic", "moderate", 100, "Year of birth."),
      v("aprop-sex", "Sex", "demographic", "low", 100, "Self-reported sex."),
      v("aprop-condition", "Index condition", "clinical", "moderate", 100, "Condition group for panel stratification.", "SNOMED CT"),
      v("aprop-eq5d", "Generic health-status instrument", "outcome", "moderate", 96.8, "Validated five-dimension health-status score."),
      v("aprop-diseasepro", "Disease-specific PRO score", "outcome", "moderate", 91.4, "Condition-specific instrument score.", "Local proprietary codes"),
      v("aprop-adherence", "Self-reported adherence scale", "outcome", "moderate", 89.7, "Validated self-report medication adherence instrument."),
      v("aprop-experience", "Care-experience measure", "outcome", "moderate", 87.2, "Patient-reported experience of care."),
      v("aprop-wave", "Survey wave", "temporal", "low", 100, "Quarterly collection wave."),
      v("aprop-mode", "Response mode", "administrative", "low", 99.5, "Online, telephone or postal."),
      v("aprop-education", "Education level", "socioeconomic", "moderate", 94.1, "Self-reported education."),
      v("aprop-employment", "Employment status", "socioeconomic", "moderate", 93.3, "Self-reported employment."),
      v("aprop-freetext", "Free-text comments", "clinical", "direct-identifier", 62.0, "Open comments; may contain identifying detail.", undefined, "Released only as coded themes"),
      v("aprop-region", "Region of residence", "geographic", "low", 99.7, "NUTS-2 region."),
    ],
    quality: {
      completeness: 89,
      timeliness: 90,
      interoperability: 64,
      consistency: 86,
      documentation: 83,
      notes: [
        "Attrition reaches about 18% per year and is higher among older participants.",
        "Disease-specific instruments differ by condition group and are not directly comparable.",
        "Free-text comments are released only as coded themes.",
      ],
    },
    provenance: {
      collectionMethod:
        "Consented quarterly survey administration in three modes, with validated instruments under licence.",
      legalBasisSummary:
        "Fictional research-cohort framework grounded in explicit participant consent. Educational description only.",
      curationProcess:
        "Instrument scoring per published manuals, attrition monitoring, and non-response weighting supplied with each release.",
      lastAudited: "2025-11-05",
      versioning: "Quarterly waves with cumulative panel files.",
    },
    permittedPurposes: [
      "Patient-reported outcomes research",
      "Care-experience and person-centred care evaluation",
      "Health-services research",
      "Instrument methodology research",
    ],
    prohibitedPurposes: [
      "Any purpose outside the scope of participant consent",
      "Commercial marketing",
      "Insurance assessment",
      "Re-identification of participants",
    ],
    accessConditions: {
      secureProcessingEnvironmentRequired: true,
      outputChecking: "Manual review with attention to free-text-derived outputs.",
      minimumAggregationThreshold: 10,
      requiredDocuments: [
        "ethics-approval",
        "study-protocol",
        "data-management-plan",
        "legal-basis-statement",
        "institutional-authorisation",
        "publication-plan",
      ],
      feeBand: "Cost recovery — moderate",
      maximumAccessMonths: 24,
    },
    knownLimitations: [
      "A consented volunteer panel is not representative of the general population.",
      "Self-reported adherence is subject to recall and social-desirability bias.",
      "Panel size limits analyses of narrow subgroups.",
    ],
    catalogueRef: "PT-CAT-0027",
    lastMetadataUpdate: "2026-01-08",
  },

  /* ---------------------------------------------------------------------- */
  {
    id: "amvs-at",
    name: "Alpine Mortality and Vital Statistics File",
    acronym: "AMVS",
    holder: "Alpine Statistical Office — Health Division (fictional)",
    country: "Austria",
    accessBody: ACCESS_BODIES["hdab-at"],
    summary:
      "National vital-statistics file with underlying and contributing causes of death, place of death, and demographic context.",
    diseaseAreas: ["Cardiovascular", "Oncology", "Respiratory", "Multi-morbidity"],
    dataCategories: ["Mortality & vital statistics"],
    populations: ["General population", "Adults (18+)", "Older adults (65+)", "Paediatric"],
    timeCoverage: { start: 1980, end: "ongoing" },
    updateFrequency: "Annual",
    codingSystems: ["ICD-10", "ICD-11"],
    approximateCohortSize: 3_100_000,
    accessComplexity: "Standard",
    linkage: {
      status: "Project-specific linkage on request",
      knownLinkedDatasets: [],
      notes:
        "The statistical office operates a formal record-linkage service with a separate approval track.",
    },
    variables: [
      v("amvs-recordid", "Death record identifier", "identifier", "moderate", 100, "Record-level identifier."),
      v("amvs-birthyear", "Year of birth", "demographic", "moderate", 100, "Year of birth."),
      v("amvs-deathdate", "Date of death", "temporal", "high", 100, "Exact date of death.", undefined, "Released as month and year unless justified"),
      v("amvs-sex", "Sex", "demographic", "low", 100, "Administrative sex category."),
      v("amvs-underlying", "Underlying cause of death", "outcome", "moderate", 99.8, "Coded per the applicable ICD revision.", "ICD-10"),
      v("amvs-contributing", "Contributing causes", "outcome", "moderate", 96.1, "Additional conditions on the certificate.", "ICD-10"),
      v("amvs-placeofdeath", "Place of death", "administrative", "moderate", 98.4, "Hospital, home, care home or other."),
      v("amvs-autopsy", "Autopsy performed", "administrative", "low", 97.2, "Whether an autopsy informed certification."),
      v("amvs-district", "District of residence", "geographic", "moderate", 99.6, "Administrative district."),
      v("amvs-maritalstatus", "Marital status", "socioeconomic", "moderate", 98.9, "Status at death."),
      v("amvs-occupation", "Last recorded occupation", "socioeconomic", "high", 76.4, "Occupational classification."),
    ],
    quality: {
      completeness: 97,
      timeliness: 61,
      interoperability: 72,
      consistency: 74,
      documentation: 89,
      notes: [
        "Records from 2024 onward are coded in ICD-11; earlier years use ICD-10 with a published bridge.",
        "The annual file is released roughly eleven months after the reference year.",
        "Certification practice for multi-morbid deaths changed in 2011.",
      ],
    },
    provenance: {
      collectionMethod:
        "Statutory civil registration with centralised cause-of-death coding by trained nosologists.",
      legalBasisSummary:
        "Fictional statistics act with a research-access provision. Educational description only.",
      curationProcess:
        "Automated coding with manual review of complex certificates, plus annual bridge-coding studies at revision changes.",
      lastAudited: "2025-08-29",
      versioning: "Annual definitive files; provisional counts published quarterly.",
    },
    permittedPurposes: [
      "Mortality and burden-of-disease research",
      "Public-health surveillance",
      "Policy evaluation",
      "Health-system performance analysis",
    ],
    prohibitedPurposes: [
      "Insurance or actuarial commercial use",
      "Genealogical or investigative tracing of individuals",
      "Re-identification of decedents or families",
    ],
    accessConditions: {
      secureProcessingEnvironmentRequired: true,
      outputChecking: "Statistical disclosure control per the office's published standard.",
      minimumAggregationThreshold: 5,
      requiredDocuments: [
        "study-protocol",
        "data-management-plan",
        "legal-basis-statement",
        "institutional-authorisation",
        "researcher-accreditation",
      ],
      feeBand: "Cost recovery — low",
      maximumAccessMonths: 36,
    },
    knownLimitations: [
      "Cause-of-death coding is known to misclassify deaths in older multi-morbid decedents.",
      "The ICD-10 to ICD-11 boundary in 2024 affects trend analyses.",
      "No treatment or care-pathway information is available.",
    ],
    catalogueRef: "AT-CAT-0018",
    lastMetadataUpdate: "2025-12-30",
  },

  /* ---------------------------------------------------------------------- */
  {
    id: "fbmd-be",
    name: "Flanders Biobank Metadata Directory",
    acronym: "FBMD",
    holder: "Flanders Biobank Consortium (fictional)",
    country: "Belgium",
    accessBody: ACCESS_BODIES["hdab-be"],
    summary:
      "Directory of sample collections and associated omics metadata — describing what exists and under what conditions, rather than releasing the measurements themselves.",
    diseaseAreas: ["Oncology", "Cardiovascular", "Neurology", "Multi-morbidity"],
    dataCategories: ["Biobank & omics metadata", "Disease registry"],
    populations: ["Adults (18+)", "Chronic disease cohort", "General population"],
    timeCoverage: { start: 2011, end: "ongoing" },
    updateFrequency: "Quarterly",
    codingSystems: ["SNOMED CT", "Local proprietary codes"],
    approximateCohortSize: 140_000,
    accessComplexity: "Complex",
    linkage: {
      status: "Project-specific linkage on request",
      knownLinkedDatasets: [],
      notes:
        "Linkage to clinical data requires a separate agreement with each contributing biobank and, for some collections, renewed participant consent.",
    },
    variables: [
      v("fbmd-collectionid", "Collection identifier", "identifier", "low", 100, "Identifier of the sample collection, not of a person."),
      v("fbmd-donorpseudo", "Donor pseudonym", "identifier", "high", 100, "Pseudonym scoped to the contributing biobank."),
      v("fbmd-sampletype", "Sample type", "clinical", "low", 100, "Blood, tissue, plasma or other.", "SNOMED CT"),
      v("fbmd-collectionyear", "Year of collection", "temporal", "low", 99.8, "Year the sample was taken."),
      v("fbmd-diagnosis", "Associated diagnosis", "clinical", "moderate", 94.6, "Diagnosis recorded at collection.", "SNOMED CT"),
      v("fbmd-agegroup", "Donor age group", "demographic", "low", 99.9, "Ten-year age bands."),
      v("fbmd-sex", "Donor sex", "demographic", "low", 99.9, "Administrative sex category."),
      v("fbmd-omicsavail", "Omics data availability", "administrative", "low", 100, "Which assay families have been run.", "Local proprietary codes"),
      v("fbmd-genotype", "Genotype summary metadata", "clinical", "high", 47.3, "Assay platform and coverage descriptors; no variant-level data.", undefined, "Metadata only; measurements never released here"),
      v("fbmd-consentscope", "Consent scope", "administrative", "moderate", 100, "Permitted research categories per the donor's consent."),
      v("fbmd-storage", "Storage and quality status", "administrative", "low", 98.7, "Storage conditions and freeze-thaw history."),
      v("fbmd-biobank", "Contributing biobank", "administrative", "low", 100, "Institution holding the collection."),
    ],
    quality: {
      completeness: 82,
      timeliness: 79,
      interoperability: 61,
      consistency: 73,
      documentation: 80,
      notes: [
        "This is a discovery directory: it tells you what samples exist, not what the assays measured.",
        "Omics availability flags are updated on a quarterly cycle and can lag actual assay completion.",
        "Consent scope varies by collection and materially constrains what any downstream study may do.",
      ],
    },
    provenance: {
      collectionMethod:
        "Quarterly metadata submissions from consortium member biobanks against a shared minimum information model.",
      legalBasisSummary:
        "Fictional consortium agreement layered over donor consent. Educational description only.",
      curationProcess:
        "Schema conformance checks, consent-scope validation, and manual curation of new collections.",
      lastAudited: "2025-10-24",
      versioning: "Quarterly directory releases.",
    },
    permittedPurposes: [
      "Feasibility assessment for sample-based research",
      "Study design and cohort discovery",
      "Methodological research on biobank interoperability",
    ],
    prohibitedPurposes: [
      "Any analysis presented as if it used the underlying biological measurements",
      "Contacting donors directly",
      "Commercial sample brokerage",
      "Re-identification of donors",
    ],
    accessConditions: {
      secureProcessingEnvironmentRequired: false,
      outputChecking: "Curator review of any output describing small collections.",
      minimumAggregationThreshold: 10,
      requiredDocuments: [
        "study-protocol",
        "data-management-plan",
        "legal-basis-statement",
        "institutional-authorisation",
        "ethics-approval",
        "conflict-of-interest",
      ],
      feeBand: "None",
      maximumAccessMonths: 12,
    },
    knownLimitations: [
      "Metadata only — no biological measurements are released through this directory.",
      "Coverage depends on consortium membership and is not exhaustive.",
      "Consent scope frequently blocks the secondary uses researchers most want.",
    ],
    catalogueRef: "BE-CAT-0091",
    lastMetadataUpdate: "2025-12-02",
  },

  /* ---------------------------------------------------------------------- */
  {
    id: "ecrf-ie",
    name: "Éire Cardiac Rehabilitation Follow-up Study",
    acronym: "ECRF",
    holder: "Irish Cardiovascular Rehabilitation Network (fictional)",
    country: "Ireland",
    accessBody: ACCESS_BODIES["hdab-ie"],
    summary:
      "Prospective follow-up study of cardiac rehabilitation participants combining programme attendance, clinical measures, self-reported adherence and readmission outcomes.",
    diseaseAreas: ["Cardiovascular"],
    dataCategories: ["Patient-reported outcomes", "Disease registry", "Hospital discharge records"],
    populations: ["Adults (18+)", "Older adults (65+)", "Chronic disease cohort"],
    timeCoverage: { start: 2016, end: "ongoing" },
    updateFrequency: "Annual",
    codingSystems: ["ICD-10", "ATC", "SNOMED CT"],
    approximateCohortSize: 47_500,
    accessComplexity: "Standard",
    linkage: {
      status: "Project-specific linkage on request",
      knownLinkedDatasets: [],
      notes:
        "Participants consented to linkage with national hospital records; each study still needs its own approval.",
    },
    variables: [
      v("ecrf-pid", "Study identifier", "identifier", "high", 100, "Study pseudonym."),
      v("ecrf-birthyear", "Year of birth", "demographic", "moderate", 100, "Year of birth."),
      v("ecrf-sex", "Sex", "demographic", "low", 100, "Administrative sex category."),
      v("ecrf-indexevent", "Index cardiac event", "clinical", "moderate", 100, "Qualifying event for programme referral.", "ICD-10"),
      v("ecrf-programme", "Rehabilitation programme attendance", "administrative", "low", 97.8, "Sessions offered and attended."),
      v("ecrf-medications", "Secondary-prevention medications", "medication", "low", 94.2, "Prescribed therapy classes at each review.", "ATC"),
      v("ecrf-selfadherence", "Self-reported adherence", "outcome", "moderate", 88.6, "Validated self-report adherence instrument."),
      v("ecrf-exercisecapacity", "Exercise capacity", "clinical", "moderate", 83.1, "Six-minute walk distance at programme entry and exit."),
      v("ecrf-qol", "Quality-of-life score", "outcome", "moderate", 86.9, "Generic health-status instrument."),
      v("ecrf-readmission", "Cardiac readmission", "outcome", "moderate", 92.4, "Linked readmission events where consent permits."),
      v("ecrf-smoking", "Smoking status", "clinical", "moderate", 91.7, "Status at each review."),
      v("ecrf-centre", "Rehabilitation centre", "administrative", "moderate", 100, "Delivering centre identifier."),
      v("ecrf-county", "County of residence", "geographic", "moderate", 99.1, "County of residence."),
    ],
    quality: {
      completeness: 87,
      timeliness: 70,
      interoperability: 76,
      consistency: 84,
      documentation: 85,
      notes: [
        "Only referred and enrolled patients appear, so the cohort excludes those never offered rehabilitation.",
        "Readmission capture depends on the linkage permission held at the time of each release.",
        "Exercise-capacity measurement was not standardised across centres before 2019.",
      ],
    },
    provenance: {
      collectionMethod:
        "Consented enrolment at participating rehabilitation centres with structured reviews at entry, exit and annually.",
      legalBasisSummary:
        "Fictional health-research regulation with explicit participant consent. Educational description only.",
      curationProcess:
        "Central data management with query resolution to centres and annual monitoring visits.",
      lastAudited: "2025-09-12",
      versioning: "Annual locked datasets.",
    },
    permittedPurposes: [
      "Cardiac rehabilitation and secondary-prevention research",
      "Adherence and behaviour research",
      "Health-services research",
      "Care-quality evaluation",
    ],
    prohibitedPurposes: [
      "Uses outside participant consent",
      "Insurance assessment",
      "Commercial recruitment",
      "Re-identification of participants",
    ],
    accessConditions: {
      secureProcessingEnvironmentRequired: true,
      outputChecking: "Study-team review followed by steering-committee sign-off for publications.",
      minimumAggregationThreshold: 5,
      requiredDocuments: [
        "ethics-approval",
        "study-protocol",
        "data-management-plan",
        "legal-basis-statement",
        "institutional-authorisation",
        "publication-plan",
      ],
      feeBand: "Cost recovery — low",
      maximumAccessMonths: 24,
    },
    knownLimitations: [
      "Referral-based enrolment produces a selected, generally healthier cohort.",
      "Self-reported adherence over-estimates true adherence.",
      "Modest cohort size limits subgroup analysis.",
    ],
    catalogueRef: "IE-CAT-0035",
    lastMetadataUpdate: "2026-01-15",
  },
];

export const DATASETS_BY_ID: Record<string, Dataset> = Object.fromEntries(
  DATASETS.map((d) => [d.id, d]),
);

export function getDataset(id: string): Dataset | undefined {
  return DATASETS_BY_ID[id];
}

export function getVariable(datasetId: string, variableId: string): DatasetVariable | undefined {
  return getDataset(datasetId)?.variables.find((variable) => variable.id === variableId);
}
