/**
 * Educational content.
 *
 * The timeline entries below describe the real, publicly documented history of
 * the European Health Data Space at a high level, and every entry links to
 * official European Commission material so a reader can check it. Everything
 * *else* in this prototype — datasets, access bodies, requirements — is
 * fictional. That distinction is stated on the page itself, not just here.
 */

export interface TimelineEntry {
  period: string;
  title: string;
  body: string;
  /** Set when the entry describes something already in force. */
  status: "background" | "adopted" | "phased-application";
}

export const EHDS_TIMELINE: TimelineEntry[] = [
  {
    period: "2016 – 2018",
    title: "The GDPR sets the baseline",
    body: "The General Data Protection Regulation establishes the EU-wide framework for personal data, including the special category rules that apply to health data and the provisions that allow member states to legislate for scientific research. Everything the European Health Data Space later adds sits on top of this baseline rather than replacing it.",
    status: "background",
  },
  {
    period: "2019 – 2021",
    title: "Fragmentation becomes the visible problem",
    body: "Across the union, researchers face a patchwork: different national rules for secondary use, different access bodies with different documentation, different terminologies, and in several countries no clear route at all. The COVID-19 pandemic makes the cost of that fragmentation obvious, as comparable data across member states proves slow or impossible to assemble.",
    status: "background",
  },
  {
    period: "May 2022",
    title: "The Commission proposes the European Health Data Space",
    body: "The European Commission publishes its legislative proposal for a European Health Data Space. It covers two broad areas: primary use, meaning individuals' access to and control over their own health data, and secondary use, meaning access to health data for research, innovation, policymaking and public health.",
    status: "background",
  },
  {
    period: "2023 – 2024",
    title: "Negotiation and political agreement",
    body: "The European Parliament and the Council work through the proposal and reach political agreement. Debate concentrates on the scope of secondary use, the role of opt-outs, the protection of intellectual property and trade secrets, and how much discretion member states retain over their own national arrangements.",
    status: "background",
  },
  {
    period: "2025",
    title: "The Regulation enters into force",
    body: "The Regulation on the European Health Data Space is adopted and enters into force, beginning a staged implementation period. Member states must designate health data access bodies, and the infrastructure for cross-border access — including the HealthData@EU platform — moves from pilot to production planning.",
    status: "adopted",
  },
  {
    period: "Staged application",
    title: "Obligations phase in over several years",
    body: "The Regulation applies in stages rather than all at once, with different categories of data and different obligations becoming applicable on different dates after entry into force. Researchers planning studies during this period should confirm the current position with the relevant national authority rather than assuming a single switch-on date.",
    status: "phased-application",
  },
];

export interface GlossaryEntry {
  term: string;
  definition: string;
  /** Whether the term is a real concept or something invented for this prototype. */
  provenance: "real-concept" | "prototype-invention";
  seeAlso?: string[];
}

export const GLOSSARY: GlossaryEntry[] = [
  {
    term: "Secondary use",
    definition:
      "Using health data for a purpose other than the one it was originally collected for. A hospital record created to treat a patient being reused to study treatment outcomes is secondary use. The European Health Data Space devotes a substantial part of its text to the conditions under which this is permitted.",
    provenance: "real-concept",
    seeAlso: ["Data permit", "Permitted purpose"],
  },
  {
    term: "Health Data Access Body",
    definition:
      "A national body that member states must designate to receive and decide on requests for secondary use of health data. It assesses applications, issues data permits, and is responsible for making data available through a secure environment. The specific bodies named in this prototype are fictional.",
    provenance: "real-concept",
    seeAlso: ["Data permit", "Secure processing environment"],
  },
  {
    term: "Data permit",
    definition:
      "The authorisation issued by a health data access body that allows a specific applicant to process specific data for a specific purpose, for a stated period, under stated conditions. It is narrower than general permission to use a dataset — the scope of the permit is the scope of what may lawfully be done.",
    provenance: "real-concept",
  },
  {
    term: "Secure processing environment",
    definition:
      "A controlled technical environment in which permitted analysis takes place. Data does not leave it; the researcher works inside it and only checked, aggregated outputs are released. This inverts the older model in which data was shipped to the researcher.",
    provenance: "real-concept",
    seeAlso: ["Output checking"],
  },
  {
    term: "Output checking",
    definition:
      "Review of anything a researcher wants to take out of a secure processing environment, to confirm it cannot identify an individual. Typically combines automated rules — minimum cell counts, suppression of small categories — with human judgement on model outputs and plots.",
    provenance: "real-concept",
    seeAlso: ["Minimum cell size", "Statistical disclosure control"],
  },
  {
    term: "Statistical disclosure control",
    definition:
      "The set of techniques used to reduce the risk that published statistics reveal information about an identifiable individual: suppression of small cells, rounding, aggregation, and secondary suppression so that suppressed values cannot be recovered by subtraction.",
    provenance: "real-concept",
  },
  {
    term: "Minimum cell size",
    definition:
      "The smallest count a holder will allow in a released table. Values below the threshold are suppressed. Thresholds of five and ten are both common; where several holders are involved, the strictest usually governs.",
    provenance: "real-concept",
  },
  {
    term: "Data minimisation",
    definition:
      "The principle that personal data processed should be adequate, relevant and limited to what is necessary for the purpose. In a data-access application this becomes concrete and per-variable: for each field requested, what analysis needs it, and would a coarser form do?",
    provenance: "real-concept",
    seeAlso: ["Pseudonymisation", "Purpose limitation"],
  },
  {
    term: "Purpose limitation",
    definition:
      "The principle that data collected for one purpose should not be further processed in a way incompatible with that purpose. In practice this is why a data permit states its purpose so precisely, and why using permitted data for a different question requires going back.",
    provenance: "real-concept",
  },
  {
    term: "Pseudonymisation",
    definition:
      "Replacing direct identifiers with a key so that data can no longer be attributed to a person without additional information held separately. Pseudonymised data is still personal data — this is a risk-reduction measure, not an exit from data protection law.",
    provenance: "real-concept",
    seeAlso: ["Anonymisation", "Re-identification"],
  },
  {
    term: "Anonymisation",
    definition:
      "Processing that irreversibly prevents identification of an individual. Genuinely anonymous data falls outside data protection law, which is precisely why the threshold is high and why most research data described as anonymous is in fact pseudonymised.",
    provenance: "real-concept",
  },
  {
    term: "Re-identification",
    definition:
      "Recovering the identity of an individual from data that was supposed to prevent it, usually by combining quasi-identifiers such as date of birth, sex and small-area geography. Every dataset in this prototype's fictional catalogue prohibits any attempt at it.",
    provenance: "real-concept",
  },
  {
    term: "Permitted purpose",
    definition:
      "A category of use that a holder or a regulation allows. Typical permitted purposes include scientific research, public health, healthcare quality and safety, and policy support. Categories such as insurance underwriting and marketing are commonly excluded outright.",
    provenance: "real-concept",
    seeAlso: ["Prohibited purpose"],
  },
  {
    term: "Prohibited purpose",
    definition:
      "A use explicitly excluded regardless of consent or safeguards — most commonly decisions detrimental to individuals, such as insurance pricing or employment screening, and advertising.",
    provenance: "real-concept",
  },
  {
    term: "Data holder",
    definition:
      "The organisation that holds the data and is responsible for its quality, documentation and availability. Distinct from the access body, which decides who may use it. The distinction matters: quality questions go to the holder, permission questions to the access body.",
    provenance: "real-concept",
  },
  {
    term: "HealthData@EU",
    definition:
      "The cross-border infrastructure intended to connect national nodes so that a researcher can discover and request data across several member states through a coordinated route rather than a separate process per country.",
    provenance: "real-concept",
  },
  {
    term: "Data quality and utility label",
    definition:
      "A structured description of a dataset's completeness, timeliness, coverage and documentation, intended to let a researcher judge fitness for purpose before applying. The quality indicators in this prototype are a simplified, fictional illustration of the idea.",
    provenance: "real-concept",
  },
  {
    term: "Record linkage",
    definition:
      "Joining records about the same person across datasets. Deterministic linkage uses a shared key; probabilistic linkage matches on combinations of attributes. Linkage increases analytical power and re-identification risk together, which is why it is usually assessed separately.",
    provenance: "real-concept",
  },
  {
    term: "Common data model",
    definition:
      "A shared structure and vocabulary — OMOP being the most widely used in observational health research — that lets the same analysis code run against datasets from different sources. Mapping into a common model is substantial work, and mapping depth varies.",
    provenance: "real-concept",
  },
  {
    term: "Trusted third party",
    definition:
      "An organisation that performs linkage on behalf of others so that no single party sees both the identifiers and the research data. Common where datasets have no shared key.",
    provenance: "real-concept",
  },
  {
    term: "Readiness score",
    definition:
      "A measure invented for this prototype. It reflects how completely the application form has been filled in and how many open findings remain. It is not a prediction of approval and no real access body uses anything like it.",
    provenance: "prototype-invention",
    seeAlso: ["Deterministic rule set"],
  },
  {
    term: "Deterministic rule set",
    definition:
      "The recommendation layer used in this prototype: hand-written rules over catalogue metadata and application text, with no model and no network call. Each finding names the rule that produced it so a user can audit the reasoning.",
    provenance: "prototype-invention",
  },
  {
    term: "Compatibility score",
    definition:
      "A pairwise heuristic invented for this prototype, combining linkage feasibility, coverage overlap, population overlap and terminology alignment. It is a conversation starter for a feasibility discussion, not a measure any holder recognises.",
    provenance: "prototype-invention",
  },
];

export const OFFICIAL_LINKS = [
  {
    label: "European Health Data Space — European Commission",
    url: "https://health.ec.europa.eu/ehealth-digital-health-and-care/european-health-data-space_en",
    note: "The Commission's overview page for the European Health Data Space.",
  },
  {
    label: "EHDS Regulation — EUR-Lex",
    url: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32025R0327",
    note: "The legal text of the Regulation as published in the Official Journal.",
  },
  {
    label: "HealthData@EU pilot project",
    url: "https://ehds2pilot.eu/",
    note: "The pilot for the cross-border infrastructure for secondary use of health data.",
  },
  {
    label: "European Data Protection Board",
    url: "https://www.edpb.europa.eu/",
    note: "Guidance and opinions on data protection law, including health data and scientific research.",
  },
  {
    label: "General Data Protection Regulation — EUR-Lex",
    url: "https://eur-lex.europa.eu/eli/reg/2016/679/oj",
    note: "The baseline framework that the European Health Data Space builds on.",
  },
];
