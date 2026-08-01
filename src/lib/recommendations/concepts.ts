import type { DataCategory, DiseaseArea } from "@/lib/types";

/**
 * A hand-written concept dictionary.
 *
 * This is deliberately the least clever part of the system. It exists so that
 * a reviewer can read the exact phrase list behind any relevance score. A real
 * deployment would replace it with a terminology service — see
 * `src/lib/recommendations/provider.ts` for the seam that makes that swap
 * possible without touching the interface.
 */

export const DISEASE_AREA_TERMS: Record<DiseaseArea, string[]> = {
  Cardiovascular: [
    "cardiovascular","cardiac","heart","coronary","myocardial","infarction","angina",
    "heart failure","stroke","atrial","hypertension","blood pressure","cholesterol",
    "statin","revascularisation","revascularization","pci","cabg","ischaemic","ischemic",
  ],
  Oncology: [
    "cancer","oncology","tumour","tumor","carcinoma","malignant","neoplasm","chemotherapy",
    "radiotherapy","metastasis","metastatic","screening","survival","staging",
  ],
  "Diabetes & Metabolic": [
    "diabetes","diabetic","glycaemic","glycemic","hba1c","insulin","metformin","obesity",
    "metabolic","glucose","nephropathy","retinopathy",
  ],
  "Mental Health": [
    "mental health","psychiatric","depression","anxiety","psychosis","schizophrenia",
    "bipolar","suicide","antidepressant","antipsychotic","wellbeing","psychological",
  ],
  Respiratory: [
    "respiratory","asthma","copd","pulmonary","lung","bronchitis","inhaler","pneumonia",
  ],
  "Infectious Disease": [
    "infection","infectious","antimicrobial","antibiotic","vaccine","vaccination",
    "influenza","sepsis","communicable","outbreak",
  ],
  Neurology: [
    "neurology","neurological","dementia","alzheimer","parkinson","epilepsy","multiple sclerosis",
    "cognitive","seizure",
  ],
  "Multi-morbidity": [
    "multimorbidity","multi-morbidity","comorbidity","comorbid","chronic disease","polypharmacy",
    "frailty","complex needs",
  ],
};

export const DATA_CATEGORY_TERMS: Record<DataCategory, string[]> = {
  "Hospital discharge records": [
    "hospital","admission","admitted","inpatient","discharge","readmission","readmitted",
    "length of stay","episode","emergency admission",
  ],
  "Prescription & dispensing": [
    "prescription","prescribing","prescribed","dispensing","dispensed","pharmacy","medication",
    "medicine","drug","adherence","persistence","refill","proportion of days covered","polypharmacy",
  ],
  "Laboratory results": [
    "laboratory","lab result","blood test","biomarker","assay","hba1c","creatinine","cholesterol",
    "egfr","ldl","analyte",
  ],
  "Disease registry": [
    "registry","register","incidence","prevalence","cohort","surveillance","case ascertainment",
  ],
  "Patient-reported outcomes": [
    "patient-reported","patient reported","pro","proms","quality of life","self-reported",
    "questionnaire","survey","experience","eq-5d",
  ],
  "Primary care records": [
    "primary care","general practice","gp","family medicine","consultation","referral",
  ],
  "Imaging metadata": ["imaging","radiology","mri","ct scan","ultrasound","scan","echocardiogram"],
  "Mortality & vital statistics": [
    "mortality","death","died","survival","cause of death","fatal","vital statistics","life expectancy",
  ],
  "Biobank & omics metadata": [
    "biobank","sample","biospecimen","genomic","genetic","omics","genotype","biomarker discovery",
  ],
};

/**
 * Terms that indicate a research purpose plausibly needs a given category of
 * variable. Used by the data-minimisation rules (MIN-04).
 */
export const VARIABLE_CATEGORY_TERMS: Record<string, string[]> = {
  demographic: ["age","sex","gender","demographic","adjust","adjusted","stratif","case mix","standardis","standardiz"],
  clinical: ["clinical","diagnosis","severity","condition","disease","comorbid","measurement","phenotype"],
  medication: ["medication","drug","prescription","dispensing","adherence","therapy","treatment","pharmac"],
  laboratory: ["laboratory","lab","biomarker","test result","hba1c","cholesterol","renal","creatinine"],
  administrative: ["pathway","service","care setting","provider","admission","referral","utilisation","utilization","cost"],
  outcome: ["outcome","readmission","mortality","survival","event","endpoint","quality of life","death"],
  socioeconomic: ["socioeconomic","inequality","inequity","deprivation","income","education","employment","social gradient","disparit"],
  geographic: ["geographic","regional","region","spatial","area","urban","rural","travel","distance","catchment"],
  temporal: ["trend","over time","longitudinal","follow-up","follow up","time to","period","seasonal","date"],
  identifier: ["linkage","link","join","match records","longitudinal follow"],
};

/** Phrases that make a scope statement hard for a reviewer to assess (MIS-03). */
export const AMBIGUOUS_PHRASES = [
  "etc",
  "and so on",
  "as needed",
  "as required",
  "if required",
  "where relevant",
  "where appropriate",
  "and similar",
  "among others",
  "various",
  "several other",
  "may include",
  "might include",
  "possibly",
  "to be determined",
  "tbd",
  "and other relevant",
  "any other",
  "as appropriate",
  "further variables",
] as const;

/** Terms echoing prohibited purposes across the fictional catalogue (PUR-01). */
export const PROHIBITED_PURPOSE_TERMS = [
  "insurance",
  "underwriting",
  "premium",
  "actuarial",
  "credit",
  "employment screening",
  "employer",
  "marketing",
  "advertis",
  "sales target",
  "commercial targeting",
  "promotion of",
  "league table",
  "ranking of providers",
  "ranking clinicians",
] as const;

/** Terms implying identification or contact of individuals (PUR-03). */
export const IDENTIFICATION_TERMS = [
  "re-identif",
  "reidentif",
  "identify individual",
  "identify patients",
  "identify specific",
  "contact patients",
  "contact participants",
  "recruit patients",
  "recruit participants",
  "invite patients",
  "trace individuals",
  "link to name",
  "individual patient identity",
] as const;

/** Terms describing who benefits from a study (PUR-02). */
export const PUBLIC_BENEFIT_TERMS = [
  "patient",
  "public health",
  "population",
  "health system",
  "clinician",
  "care quality",
  "guideline",
  "policy",
  "equity",
  "inequality",
  "outcome",
  "prevention",
  "cost-effectiveness",
  "service planning",
  "benefit",
] as const;

/** Narrative terms associated with each declared purpose category (PUR-04). */
export const PURPOSE_CATEGORY_TERMS: Record<string, string[]> = {
  "scientific-research": ["hypothesis","research question","association","cohort","evidence","investigate","estimate","study"],
  "public-health": ["surveillance","population health","public health","prevention","incidence","outbreak","screening"],
  "healthcare-quality": ["quality","safety","standard of care","variation","improvement","audit","performance"],
  "policy-support": ["policy","reimbursement","planning","regulation","decision-makers","commissioning","resource allocation"],
  "innovation-development": ["product","algorithm","model development","tool","device","prototype","validation of a model","commercial"],
  "education-training": ["teaching","training","curriculum","education","learning","demonstration"],
};

/**
 * Groups variable names that describe the same analytical concept, used to
 * detect duplicate requests across datasets (MIN-07).
 */
export const CONCEPT_GROUPS: { concept: string; terms: string[] }[] = [
  { concept: "Year of birth / age", terms: ["year of birth", "age group", "date of birth"] },
  { concept: "Sex", terms: ["sex"] },
  { concept: "Region of residence", terms: ["region", "county", "province", "district", "commune", "municipality", "voivodeship", "postcode", "urbanicity"] },
  { concept: "Death / vital status", terms: ["death", "vital status", "mortality", "survival"] },
  { concept: "Medication exposure", terms: ["atc", "dispens", "prescription", "medication"] },
  { concept: "Medication adherence", terms: ["adherence", "days covered"] },
  { concept: "Diagnosis", terms: ["diagnosis", "diagnoses", "topography"] },
  { concept: "Hospital admission / readmission", terms: ["admission", "readmission", "hospitalisation", "inpatient"] },
  { concept: "Socioeconomic position", terms: ["income", "education", "employment", "deprivation", "occupation", "socioeconomic"] },
  { concept: "Laboratory measurement", terms: ["hba1c", "ldl", "egfr", "result value", "laboratory result", "test code"] },
];
