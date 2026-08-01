# Responsible use

> DataPermit EU is an independent fictional portfolio prototype. It is not an official European
> Commission, EHDS, HealthData@EU or national Health Data Access Body service, and it has no
> standing in any real data-access process.

## What this tool is

A design exploration of how a researcher might move from a research question to a well-formed,
privacy-conscious data-access application — and how the reasoning behind that application might be
kept attached to the result.

## What this tool is not

- **Not a legal service.** It draws no legal conclusions, interprets no regulation, and gives no
  legal advice. Where it mentions a legal basis it is repeating text a user typed or a fictional
  catalogue entry.
- **Not an ethics review.** It cannot assess ethical acceptability.
- **Not a compliance check.** It does not determine whether a request complies with any law, any
  holder policy, or any regulation.
- **Not a real catalogue.** All 15 datasets and every holder, access body, requirement, quality score
  and turnaround time are invented.
- **Not a submission channel.** Nothing is ever transmitted anywhere. Statuses in the tracker are
  labels you set yourself.
- **Not a predictor of approval.** The readiness score measures how completely a form has been
  filled in. It says nothing about scientific merit, legal basis, ethical acceptability, or whether
  any access body would grant a request.

**Anything that matters must be confirmed with qualified legal advisers, a research ethics
committee, and the competent data-access authority.**

## Commitments in the recommendation layer

These are design commitments, enforced in the code and visible in the interface.

### 1. No unexplained findings

Every recommendation carries a plain-language `reason`, an `evidence` array, and the `ruleId` of the
rule that produced it. Expanding a finding shows the rule's signal and its documented weaknesses.
All 34 rules are published in full on the methodology page, including the ones known to produce
false positives.

Both `reason` and `evidence` are **required, non-optional fields** on the `Recommendation` type. An
implementation that could not populate them honestly would fail to compile.

### 2. The tool never decides

No finding removes a variable, changes a field, or blocks a step. Every finding can be dismissed, and
dismissals are written to the audit trail with a timestamp rather than quietly dropped — the user
stays in control while the record stays honest about what was considered and set aside.

The `Recommendation` type has no `verdict`, `approved`, `compliant` or `blocking` field. The shape
cannot express a decision, only a prompt.

### 3. Rules disclose where they fail

Each rule's published entry includes a `knownWeakness`. `MIN-04` — which flags variables whose
category appears nowhere in the stated purpose — is documented as noisy by design, because
confounder adjustment routinely needs variables a purpose statement never names. The interface says
so at the point the finding appears, not only in the documentation.

### 4. Scores are bounded and explained

Three numbers appear in the product: relevance, compatibility and readiness. All three have their
arithmetic published in full. Readiness in particular is labelled repeatedly as a measure of form
completion rather than a prediction, because a number in a governance interface will be read as a
prediction unless it is actively prevented from being one.

Confidence values are never shown as decimals — only as Low, Moderate or High — for the same reason.

### 5. Fiction is labelled as fiction

The independence disclaimer sits in the header of every page, in full on the landing page, and in
every export including the print-ready view. The glossary marks each term as either a real concept or
an invention of this prototype. Fictional access bodies and holders carry "(fictional)" in their
names.

## If you extend this project

The recommendation layer sits behind a `RecommendationProvider` interface specifically so it can be
replaced by a language model or a terminology service. If you do that, the constraints above should
survive the swap:

- **Keep `reason` and `evidence` honest.** A model that generates a plausible-sounding rationale
  unconnected to what it actually did is worse than no explanation, because it manufactures
  confidence rather than supporting judgement.
- **Do not let a model produce legal or ethical conclusions**, and do not let one be prompted into
  approving or rejecting anything.
- **Keep every finding dismissible**, and keep dismissals in the audit trail.
- **Log which provider produced each finding.** The `source` field exists for this. A user should
  always be able to tell whether a rule or a model raised something.
- **Be candid about non-determinism.** The provider interface carries a `deterministic` flag, and the
  methodology page renders it. A user who sees different findings on identical input deserves to know
  that is expected.
- **Watch for a new failure mode.** Deterministic rules fail visibly and consistently; a model can
  fail plausibly and inconsistently, which is harder for a user to catch. Any model-backed
  implementation needs its own evaluation against known cases, not just the existing test suite.

## Using the fictional content

The catalogue is offered under the same MIT licence as the code. If you reuse it:

- Keep it labelled as fictional. It is internally consistent enough to look real, which is precisely
  why presenting it without that label would be misleading.
- Do not present the fictional access bodies, holders or requirements as though they describe real
  organisations or real obligations.
- Do not use the quality scores or turnaround times as though they were measurements of anything.

## For the real thing

- [European Health Data Space — European Commission](https://health.ec.europa.eu/ehealth-digital-health-and-care/european-health-data-space_en)
- [EHDS Regulation — EUR-Lex](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32025R0327)
- [HealthData@EU pilot project](https://ehds2pilot.eu/)
- [European Data Protection Board](https://www.edpb.europa.eu/)
- [General Data Protection Regulation — EUR-Lex](https://eur-lex.europa.eu/eli/reg/2016/679/oj)

For a specific study, your national Health Data Access Body, your institution's data protection
officer, and your research ethics committee are the authorities — not this prototype.
