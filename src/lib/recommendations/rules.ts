import type { RecommendationKind } from "@/lib/types";

/**
 * The rule catalogue.
 *
 * Every finding the product surfaces carries a `ruleId` that resolves to an
 * entry here. The methodology page renders this catalogue verbatim so a user
 * can audit the full decision logic without reading the source.
 */
export interface RuleDefinition {
  id: string;
  kind: RecommendationKind;
  title: string;
  /** What the rule looks at. */
  signal: string;
  /** Why it might matter to a researcher. */
  rationale: string;
  /** Documented failure modes — stated plainly, not hidden. */
  knownWeakness: string;
}

export const RULES: RuleDefinition[] = [
  /* --- Dataset relevance ------------------------------------------------ */
  {
    id: "REL-01",
    kind: "dataset-relevance",
    title: "Disease-area concept match",
    signal:
      "Terms in the research question are matched against a fixed concept dictionary that maps phrases such as 'heart failure' or 'readmission' onto catalogue disease areas.",
    rationale:
      "A dataset covering the disease area named in the question is more likely to contain a usable study population.",
    knownWeakness:
      "The dictionary is hand-written and English-only. Synonyms it does not know about score zero, and a question phrased in another language will match nothing.",
  },
  {
    id: "REL-02",
    kind: "dataset-relevance",
    title: "Data-category concept match",
    signal:
      "Phrases such as 'dispensing', 'discharge' or 'lab result' are mapped onto catalogue data categories and matched against each dataset.",
    rationale:
      "The kind of record a study needs is usually stated explicitly in the research question.",
    knownWeakness:
      "A study can need a category the researcher never names. Absence of a match is not evidence a dataset is unsuitable.",
  },
  {
    id: "REL-03",
    kind: "dataset-relevance",
    title: "Variable-level keyword overlap",
    signal:
      "Content words from the research question are compared with dataset variable names, descriptions and the dataset summary.",
    rationale:
      "Variable-level matches distinguish datasets that merely sit in the right disease area from ones that hold the specific measures a study needs.",
    knownWeakness:
      "Pure string overlap. It cannot tell that 'adherence' can be derived from dispensing dates, so it under-scores datasets that support a measure indirectly.",
  },
  {
    id: "REL-04",
    kind: "dataset-relevance",
    title: "Fitness adjustment for quality and access burden",
    signal:
      "The keyword score is adjusted by the dataset's documented completeness and interoperability, and by its access complexity band.",
    rationale:
      "Two datasets can be equally on-topic while differing sharply in how usable and how obtainable they are.",
    knownWeakness:
      "Quality scores in this prototype are fictional. The adjustment demonstrates the mechanism, not a real assessment.",
  },

  /* --- Cross-dataset compatibility ------------------------------------- */
  {
    id: "CMP-01",
    kind: "cross-dataset-compatibility",
    title: "No shared linkage mechanism",
    signal:
      "Datasets in the project are compared on their declared linkage status and known prior linkages.",
    rationale:
      "Record-level analysis across datasets is impossible without some route to connect the same person's records.",
    knownWeakness:
      "The catalogue records only what a holder has declared. A linkage route may exist that this metadata does not describe.",
  },
  {
    id: "CMP-02",
    kind: "cross-dataset-compatibility",
    title: "Cross-border combination",
    signal: "The project contains datasets held in more than one country.",
    rationale:
      "Each jurisdiction runs its own access process, so multi-country projects mean parallel applications and longer timelines.",
    knownWeakness:
      "Purely a count of countries. It cannot assess whether a cross-border route has actually been established between two specific holders.",
  },
  {
    id: "CMP-03",
    kind: "cross-dataset-compatibility",
    title: "Time-coverage gap",
    signal: "Declared coverage windows are intersected across the project's datasets.",
    rationale:
      "The usable study period is the intersection of coverage, which is often much shorter than any single dataset suggests.",
    knownWeakness:
      "Uses declared start and end years only. It does not know about partial coverage or quality ramp-up inside a window.",
  },
  {
    id: "CMP-04",
    kind: "cross-dataset-compatibility",
    title: "Population overlap",
    signal: "Declared population coverage is compared across datasets.",
    rationale:
      "Datasets describing different populations may not combine into a coherent cohort.",
    knownWeakness:
      "Population labels are coarse. Two datasets both labelled 'general population' can still describe very different groups.",
  },
  {
    id: "CMP-05",
    kind: "cross-dataset-compatibility",
    title: "Divergent update cadence",
    signal:
      "Update frequencies are compared, and closed archives are identified from a fixed coverage end year.",
    rationale:
      "Combining a continuously updated source with a closed archive constrains the analysable period and complicates refresh.",
    knownWeakness: "Cadence labels are self-declared and may not reflect actual release behaviour.",
  },
  {
    id: "CMP-06",
    kind: "cross-dataset-compatibility",
    title: "Governing access constraints",
    signal:
      "Aggregation thresholds, maximum access durations and secure-environment requirements are compared across datasets.",
    rationale:
      "In a combined project the strictest condition generally governs, which researchers often discover late.",
    knownWeakness:
      "Assumes the strictest condition applies. Real holders may negotiate different arrangements.",
  },
  {
    id: "CMP-07",
    kind: "cross-dataset-compatibility",
    title: "Interoperability spread",
    signal: "The gap between the highest and lowest interoperability scores in the project.",
    rationale:
      "A large spread signals that harmonisation effort will concentrate on one or two sources.",
    knownWeakness: "A single composite score hides which specific domains are hard to harmonise.",
  },

  /* --- Terminology ------------------------------------------------------ */
  {
    id: "TRM-01",
    kind: "terminology-conflict",
    title: "Diagnosis classification mismatch",
    signal:
      "Datasets are compared on the diagnosis classifications they declare — ICD-10, ICD-11, SNOMED CT or ICPC-2. A mismatch between ICD revisions counts as a conflict even where the pair shares another terminology, because a shared entry elsewhere does not make two ICD revisions interoperate.",
    rationale:
      "Cohort definitions written against one classification do not transfer unchanged to another, and crosswalks lose information.",
    knownWeakness:
      "Operates on declared coding systems, not on the actual codes in the requested variables. A holder that declares a classification it uses for only one field will still be compared as though it used it throughout.",
  },
  {
    id: "TRM-02",
    kind: "terminology-conflict",
    title: "Local proprietary coding without a published crosswalk",
    signal: "A dataset declares local proprietary codes among its coding systems.",
    rationale:
      "Local schemes require a mapping step that must be planned, resourced and described in the analysis plan.",
    knownWeakness:
      "Cannot tell whether a usable mapping exists in practice; it only knows the catalogue says the scheme is local.",
  },
  {
    id: "TRM-03",
    kind: "terminology-conflict",
    title: "No shared terminology between two datasets",
    signal: "The intersection of declared coding systems between a dataset pair is empty.",
    rationale:
      "Without any common terminology, every combined concept needs bespoke mapping.",
    knownWeakness:
      "Datasets covering genuinely different domains — laboratory and mortality, say — will always look disjoint without that being a problem.",
  },
  {
    id: "TRM-04",
    kind: "terminology-conflict",
    title: "Partial common-data-model coverage",
    signal: "Some but not all project datasets declare an OMOP common data model mapping.",
    rationale:
      "Partial coverage means analysis code cannot be written once against a single model.",
    knownWeakness: "Declared CDM support says nothing about mapping depth or vocabulary version.",
  },

  /* --- Missing information --------------------------------------------- */
  {
    id: "MIS-01",
    kind: "missing-information",
    title: "Unanswered application section",
    signal: "Required application fields are checked for empty or very short values.",
    rationale: "Incomplete sections are the most common reason a submission is returned.",
    knownWeakness: "Length is a poor proxy for substance. A long answer can still be inadequate.",
  },
  {
    id: "MIS-02",
    kind: "missing-information",
    title: "Documentation required by a selected dataset is missing",
    signal:
      "The union of documents required by every dataset in the project is compared with the documents recorded on the application.",
    rationale:
      "Requirements differ by holder, so adding one dataset can silently introduce a new document obligation.",
    knownWeakness:
      "Requirements in this prototype are fictional. Real obligations must come from the relevant access body.",
  },
  {
    id: "MIS-03",
    kind: "missing-information",
    title: "Ambiguous or open-ended phrasing",
    signal:
      "A fixed list of hedging phrases — 'etc', 'as needed', 'various', 'where relevant', 'and similar' — is matched against free-text answers.",
    rationale:
      "Open-ended scope statements are hard for a reviewer to assess and invite clarification requests.",
    knownWeakness:
      "A phrase list cannot judge context. Legitimate uses of these phrases will be flagged.",
  },
  {
    id: "MIS-04",
    kind: "missing-information",
    title: "Requested duration exceeds a dataset maximum",
    signal:
      "The requested access period is compared with the shortest maximum access duration across the project's datasets.",
    rationale:
      "A request longer than a holder permits will be reduced or returned.",
    knownWeakness: "Assumes no extension route exists, which is often not true.",
  },
  {
    id: "MIS-05",
    kind: "missing-information",
    title: "Study period outside available coverage",
    signal:
      "The requested time period is compared with the intersection of dataset coverage windows.",
    rationale: "A study period partly outside coverage yields a smaller cohort than planned.",
    knownWeakness: "Compares years only, ignoring within-year availability.",
  },
  {
    id: "MIS-06",
    kind: "missing-information",
    title: "Linkage requested where a dataset supports none",
    signal:
      "The linkage request flag is compared with each dataset's declared linkage status.",
    rationale: "An analysis plan that assumes linkage will fail if a holder cannot provide it.",
    knownWeakness:
      "Some studies need linkage for only a subset of sources; the rule does not model that nuance.",
  },
  {
    id: "MIS-07",
    kind: "missing-information",
    title: "Outstanding attestation",
    signal: "The application's attestation checkboxes are checked for completion.",
    rationale: "Unsigned attestations block submission in most access processes.",
    knownWeakness: "Purely mechanical.",
  },
  {
    id: "MIS-08",
    kind: "missing-information",
    title: "No variables requested from a selected dataset",
    signal:
      "Each dataset in the project is checked for at least one requested variable.",
    rationale:
      "A dataset with no requested variables adds review burden and cost without contributing to the analysis.",
    knownWeakness:
      "A dataset may legitimately be listed for feasibility or contextual reasons.",
  },

  /* --- Data minimisation ------------------------------------------------ */
  {
    id: "MIN-01",
    kind: "data-minimisation",
    title: "Direct identifier requested",
    signal: "Requested variables are checked against the catalogue's direct-identifier flag.",
    rationale:
      "Direct identifiers rarely belong in a secondary-use request and attract the heaviest scrutiny.",
    knownWeakness:
      "Classification comes from fictional catalogue metadata rather than an assessment of the actual field.",
  },
  {
    id: "MIN-02",
    kind: "data-minimisation",
    title: "Coarser form available but full detail requested",
    signal:
      "Variables whose catalogue entry offers a default coarsened form are checked against the requested granularity.",
    rationale:
      "Accepting the coarser form often satisfies the analysis while materially reducing disclosure risk.",
    knownWeakness:
      "Some analyses genuinely need full granularity; the rule cannot tell which.",
  },
  {
    id: "MIN-03",
    kind: "data-minimisation",
    title: "Sensitive variable without a specific justification",
    signal:
      "High-sensitivity variables are checked for a justification of meaningful length that is not a restatement of the variable name.",
    rationale:
      "A per-variable justification is what makes a minimisation argument reviewable.",
    knownWeakness: "Length and repetition are weak proxies for a good justification.",
  },
  {
    id: "MIN-04",
    kind: "data-minimisation",
    title: "Variable category unconnected to the stated purpose",
    signal:
      "A variable's analytical category is checked for supporting terms in the research purpose and analysis plan.",
    rationale:
      "Variables with no visible link to the stated purpose are the clearest minimisation candidates.",
    knownWeakness:
      "Confounder adjustment often needs variables the purpose statement never mentions. Expect false positives.",
  },
  {
    id: "MIN-05",
    kind: "data-minimisation",
    title: "Broad share of a dataset requested",
    signal:
      "The proportion of a dataset's variables included in the request is compared with a fixed threshold.",
    rationale:
      "Requesting most of a dataset suggests scope was not derived from the analysis plan.",
    knownWeakness:
      "Small datasets can legitimately be requested almost in full.",
  },
  {
    id: "MIN-06",
    kind: "data-minimisation",
    title: "Free-text field requested",
    signal: "Requested variables are checked for unstructured free-text content.",
    rationale:
      "Free text carries a high residual re-identification risk and is usually excluded by default.",
    knownWeakness: "Some methodological research genuinely targets free text.",
  },
  {
    id: "MIN-07",
    kind: "data-minimisation",
    title: "Overlapping variables across datasets",
    signal:
      "Requested variables are grouped by analytical concept to find the same measure requested from several sources.",
    rationale:
      "Duplicate measures need a stated reason, such as validation, or one source can be dropped.",
    knownWeakness:
      "Concept grouping is name-based and will both miss and over-group.",
  },

  /* --- Purpose concerns -------------------------------------------------- */
  {
    id: "PUR-01",
    kind: "purpose-concern",
    title: "Language resembling a prohibited purpose",
    signal:
      "The purpose text is matched against terms drawn from the prohibited-purpose lists of the selected datasets.",
    rationale:
      "Wording that echoes a prohibited use invites a clarification request even when the intent is legitimate.",
    knownWeakness:
      "Keyword matching, so a discussion *about* insurance in a legitimate study will be flagged.",
  },
  {
    id: "PUR-02",
    kind: "purpose-concern",
    title: "Weak public-interest justification",
    signal:
      "The public-interest justification is checked for length and for terms describing a beneficiary group or an expected benefit.",
    rationale:
      "Public-interest reasoning is assessed explicitly in most secondary-use processes.",
    knownWeakness: "Cannot judge whether a stated benefit is plausible.",
  },
  {
    id: "PUR-03",
    kind: "purpose-concern",
    title: "Language implying individual-level identification or contact",
    signal:
      "Purpose and analysis text are matched against phrases about identifying, contacting or recruiting individuals.",
    rationale:
      "Any suggestion of re-identification or participant contact changes the nature of the request entirely.",
    knownWeakness: "Cannot distinguish a description of what the study will *not* do.",
  },
  {
    id: "PUR-04",
    kind: "purpose-concern",
    title: "Purpose category inconsistent with the narrative",
    signal:
      "The selected purpose category is compared with terms present in the purpose narrative.",
    rationale:
      "A mismatch between the declared category and the description is a common source of review delay.",
    knownWeakness:
      "Studies frequently span categories, so a mismatch is not necessarily an error.",
  },
];

export const RULES_BY_ID: Record<string, RuleDefinition> = Object.fromEntries(
  RULES.map((rule) => [rule.id, rule]),
);
