# Roadmap

What it would take to move DataPermit EU from a design prototype toward something that could sit
alongside real European health-data infrastructure.

> This roadmap describes hypothetical work on an independent prototype. It is not a plan for, a
> proposal to, or a statement about the European Commission, the EHDS, HealthData@EU or any national
> Health Data Access Body.

Ordered roughly by dependency — later items generally need earlier ones.

---

## 1. Machine-readable dataset metadata

**Today:** 14 hand-authored fictional datasets in a TypeScript file.

**Required:** ingestion from real holder metadata rather than authored content.

- Adopt a shared metadata schema — DCAT-AP for discovery, with a health extension covering coverage,
  quality indicators, access conditions and linkage availability.
- Build ingestion adapters, because most holders today publish nothing structured at all. Realistic
  input ranges from a well-formed catalogue endpoint to a PDF.
- Version metadata and surface staleness. A catalogue entry last updated three years ago should say
  so, prominently, rather than looking identical to one refreshed last week.
- Model provenance of the *metadata itself*, distinctly from provenance of the data.

**Hardest part:** the long tail of holders with no structured metadata. Ingestion is easy; getting
holders to publish is the actual problem, and it is organisational rather than technical.

---

## 2. A terminology service

**Today:** terminology rules compare declared coding-system *labels*. `TRM-01` knows that one dataset
says "ICD-10" and another says "ICD-11"; it knows nothing about what that means for a specific
cohort definition.

**Required:** a service that can reason about concepts.

- SNOMED CT and LOINC terminology server endpoints for concept lookup, subsumption and expansion.
- Published ICD-10 to ICD-11 crosswalks, applied to actual requested variables rather than to
  dataset-level declarations.
- Honest reporting of what a mapping *loses* — a crosswalk that silently collapses two distinct
  concepts is worse than no crosswalk, because it produces a confident wrong answer.
- Concept-level cohort definition, so a researcher can express "acute coronary syndrome" once and see
  how it resolves in each source.

**This is the single largest gap** between the prototype and something genuinely useful. It is also
the item most likely to change the product's shape: with real concept reasoning, the comparison
workspace stops being advisory and starts being able to show a researcher the actual cohort
consequences of a terminology mismatch.

---

## 3. Authentication and researcher accreditation

**Today:** a cosmetic role switch with no authentication, no authorisation and no data separation.

**Required:** real identity.

- Federated identity through existing research infrastructure rather than a bespoke account system.
- Institutional affiliation as a verified attribute, since most access processes assess the
  institution as well as the individual.
- Accreditation status per holder, where holders require training or accreditation — with the access
  body remaining the authority on who is accredited, not the tool.
- Genuine separation between applicant and reviewer views, including data access controls, not just
  differing UI.
- Delegation and team support: research applications are rarely written by one person.

**Constraint worth keeping:** the tool should never become the authority on identity or
accreditation. It should reflect what the authoritative systems say.

---

## 4. Dataset and permit APIs

**Today:** JSON and print exports that a human carries to whatever process comes next.

**Required:** submission that reaches each access body's own system.

- Adapter per jurisdiction. Access-body systems differ per member state; a single universal
  submission API is not a realistic near-term target, and pretending otherwise would build the wrong
  abstraction.
- Status flowing back, so the tracker reflects reality rather than a label the applicant set.
- Clarification requests received and answered in-tool, since clarification rounds are where most
  applications actually spend their time.
- Permit representation: once granted, a permit defines the *actual* scope of what may be done, which
  is narrower and more precise than the application that requested it.

---

## 5. Secure processing environment integration

**Today:** nothing. The prototype stops at the application.

**Required:** clean handover to the environment where the work happens.

- Environment provisioning triggered by permit grant.
- The approved variable list handed over as an actual data specification, so what was approved and
  what is provisioned cannot drift apart.
- Output-checking requests routed back through the holder, with status visible to the researcher.
- Access period and expiry tracked, with the destruction plan the applicant wrote actually enforced
  at the end rather than merely recorded.

**Design note:** this is where the audit trail earns its keep. A chain from research question →
requested variables → justification → approved scope → provisioned data → checked outputs is exactly
what nobody currently has.

---

## 6. Multilingual interfaces

**Today:** English only — and, more consequentially, the concept dictionary behind relevance matching
is English-only, so a research question in Finnish scores zero against every dataset.

**Required:**

- Interface translation across supported languages.
- **Multilingual concept matching**, which is the harder half: a question written in one language must
  match a catalogue described in another. This is a terminology problem, and depends on item 2.
- Locale-aware formatting for dates, numbers and cohort sizes.
- Careful handling of the fact that clinical terminology is often used in English even by
  non-English-speaking clinicians, so language detection alone is insufficient.

Until this is done, the tool has a functional accessibility barrier, not merely a localisation gap —
which is why it is recorded in `ACCESSIBILITY.md` as well as here.

---

## 7. National Health Data Access Bodies and cross-border coordination

**Today:** the compatibility rules assume parallel national applications, and say so.

**Required:** modelling the coordinated route.

- HealthData@EU as a first-class path, rather than treating multi-country requests as *n* independent
  national ones.
- Per-body requirement profiles maintained from authoritative sources rather than authored.
- Realistic timeline modelling, including the dependency structure between bodies where one decision
  gates another.
- Feedback loop: aggregate, anonymous data on where applications commonly need clarification would
  make the guidance genuinely useful — and would need its own governance, since it is data about
  applicants.

---

## Smaller improvements

Not on the critical path, but worth doing.

**Product**

- Application templates by study design (cohort, case-control, self-controlled, ecological), since
  the variable set follows fairly predictably from the design.
- Feasibility estimation: approximate cohort size from the stated criteria before applying.
- Version history and diff on an application, so a researcher can see what changed between drafts.
- Collaborative editing with per-section comment threads.
- Import of an existing protocol to prefill the builder.

**Recommendation layer**

- Evaluation harness with a labelled corpus of applications, so rule changes can be measured rather
  than argued about. This is a prerequisite for any model-backed provider.
- Confidence calibration against that corpus.
- User feedback on findings ("this was helpful" / "this was wrong"), aggregated to identify rules
  that need retiring.

**Engineering**

- Automated accessibility checks in CI (axe), plus screen-reader testing with real users.
- Optional server-side persistence for users who want cross-device access, with encryption at rest
  and a clear controllership position — see `PRIVACY_SECURITY.md`.
- A Content Security Policy and security headers.
- Visual regression testing on the catalogue and dataset profiles.
- Storage schema migrations, so a stored workspace survives a version bump rather than falling back
  to demo content.

---

## What should not change

Whatever else this becomes, four things should survive:

1. **Every finding explains itself.** The moment a tool like this produces findings a user cannot
   interrogate, it stops helping people reason and starts making decisions on their behalf, in a
   domain where that is not acceptable.
2. **The tool never decides.** No approval prediction, no compliance verdict, no legal conclusion.
3. **The user can always dismiss a finding**, and the dismissal is recorded rather than hidden.
4. **Fiction stays labelled as fiction** — and if real data ever replaces it, the labelling must
   change with equal prominence, so nobody is left believing the catalogue is still a demonstration
   when it is not.
