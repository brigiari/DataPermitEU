import type { Metadata } from "next";
import Link from "next/link";
import { RULES, type RuleDefinition } from "@/lib/recommendations/rules";
import { KIND_LABELS, deterministicProvider } from "@/lib/recommendations";
import { DATASETS } from "@/lib/data/datasets";
import { Badge, Callout, Card, SectionHeading } from "@/components/ui/primitives";
import { DisclaimerPanel } from "@/components/PrototypeDisclaimer";
import type { RecommendationKind } from "@/lib/types";

export const metadata: Metadata = {
  title: "Methodology and limitations",
  description:
    "The full rule catalogue behind every recommendation in DataPermit EU, each with its signal, rationale and documented weaknesses, plus an honest account of what the prototype cannot do.",
};

const KIND_ANCHORS: Record<RecommendationKind, string> = {
  "dataset-relevance": "relevance",
  "cross-dataset-compatibility": "compatibility",
  "terminology-conflict": "terminology",
  "missing-information": "missing",
  "data-minimisation": "minimisation",
  "purpose-concern": "purpose",
};

function RuleCard({ rule }: { rule: RuleDefinition }) {
  return (
    <Card as="li" id={rule.id} className="scroll-mt-32">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="font-mono text-sm font-semibold text-cyan-800">{rule.id}</span>
        <Badge>{KIND_LABELS[rule.kind]}</Badge>
      </div>
      <h3 className="text-base font-semibold">{rule.title}</h3>
      <dl className="mt-3 space-y-3 text-sm">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-ink-500">Signal</dt>
          <dd className="mt-0.5 text-ink-700">{rule.signal}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-ink-500">
            Why it might matter
          </dt>
          <dd className="mt-0.5 text-ink-700">{rule.rationale}</dd>
        </div>
        <div className="trust-rule border-l-2 border-amber-400">
          <dt className="text-xs font-semibold uppercase tracking-wide text-amber-800">
            Known weakness
          </dt>
          <dd className="mt-0.5 text-ink-700">{rule.knownWeakness}</dd>
        </div>
      </dl>
    </Card>
  );
}

export default function MethodologyPage() {
  const byKind = (Object.keys(KIND_ANCHORS) as RecommendationKind[]).map((kind) => ({
    kind,
    anchor: KIND_ANCHORS[kind],
    rules: RULES.filter((rule) => rule.kind === kind),
  }));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <SectionHeading
        eyebrow="Transparency"
        title="Methodology and limitations"
        description="Every recommendation in this product comes from one of the rules below. They are published in full, including the cases where they are known to be wrong, because a recommendation a user cannot audit is one they cannot sensibly act on."
      />

      <DisclaimerPanel />

      {/* Provider ---------------------------------------------------------- */}
      <section aria-labelledby="provider-heading" className="mt-10">
        <SectionHeading id="provider-heading" eyebrow="Architecture" title="The recommendation layer" />
        <Card>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold">{deterministicProvider.label}</h3>
            <Badge tone="positive">
              {deterministicProvider.deterministic ? "Deterministic" : "Non-deterministic"}
            </Badge>
            <span className="font-mono text-xs text-ink-500">{deterministicProvider.id}</span>
          </div>
          <p className="prose-body mt-2">{deterministicProvider.description}</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <h4 className="text-sm font-semibold">What it reads</h4>
              <ul className="mt-1.5 space-y-1 text-sm text-ink-700">
                <li>· Catalogue metadata for the datasets in a project</li>
                <li>· The research question and application free text</li>
                <li>· The requested variables and their recorded justifications</li>
                <li>· A hand-written concept dictionary of clinical and record-type terms</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold">What it never does</h4>
              <ul className="mt-1.5 space-y-1 text-sm text-ink-700">
                <li>· Send anything over a network</li>
                <li>· Reach a legal or ethical conclusion</li>
                <li>· Predict whether an application would be approved</li>
                <li>· Change the application without the user acting</li>
              </ul>
            </div>
          </div>

          <div className="mt-5 border-t border-ink-100 pt-4">
            <h4 className="text-sm font-semibold">Replacing it with a model</h4>
            <p className="prose-body mt-1.5">
              The layer sits behind a{" "}
              <code className="rounded bg-ink-100 px-1 py-0.5 font-mono text-xs">
                RecommendationProvider
              </code>{" "}
              interface. A language model or a terminology service could implement it and be swapped
              in by changing one export, with no interface change — but two constraints would still
              apply to whatever replaced it. First, every finding must carry a plain-language reason
              and its supporting evidence; a finding a user cannot interrogate must not be shown.
              Second, no finding may be presented as a decision. Those constraints are why the
              interface, and not just the current implementation, requires a{" "}
              <code className="rounded bg-ink-100 px-1 py-0.5 font-mono text-xs">reason</code> and an{" "}
              <code className="rounded bg-ink-100 px-1 py-0.5 font-mono text-xs">evidence</code>{" "}
              field on every result.
            </p>
          </div>
        </Card>
      </section>

      {/* Scoring formulas --------------------------------------------------- */}
      <section aria-labelledby="formulas-heading" className="mt-10">
        <SectionHeading
          id="formulas-heading"
          eyebrow="Arithmetic"
          title="The three scores, in full"
          description="No score in this product is a black box. Here is exactly how each is computed."
        />
        <div className="grid gap-4 lg:grid-cols-3">
          <Card>
            <h3 className="text-base font-semibold">Relevance score (0–100)</h3>
            <ul className="mt-2 space-y-1.5 text-sm text-ink-700">
              <li>· Disease-area concept match: 30 points, all or nothing</li>
              <li>· Record-type concept match: 25 points, all or nothing</li>
              <li>· Variable keyword overlap: up to 25, scaled at 3 matching variables for full marks</li>
              <li>· Description overlap: up to 10</li>
              <li>
                · Usability and access burden: up to 10, from mean of completeness and
                interoperability, minus 0.4 for complex access or 0.15 for standard
              </li>
            </ul>
            <p className="mt-3 text-xs text-ink-500">
              Bands: 60+ strong signal, 30–59 possible fit, below 30 weak signal.
            </p>
          </Card>
          <Card>
            <h3 className="text-base font-semibold">Compatibility score (0–100)</h3>
            <p className="mt-2 text-sm text-ink-700">Starts at 100 for a dataset pair, then subtracts:</p>
            <ul className="mt-2 space-y-1.5 text-sm text-ink-700">
              <li>· 45 if linkage is blocked, 20 if it is only theoretically possible</li>
              <li>· 30 if there is no shared coverage year, 10 if the overlap is under 3 years</li>
              <li>· 15 if no population is declared in common</li>
              <li>· 15 for a diagnosis classification conflict</li>
              <li>· 10 if no coding system is shared</li>
              <li>· 10 if the datasets sit in different countries</li>
              <li>· 1 per 10 points of interoperability difference</li>
            </ul>
          </Card>
          <Card>
            <h3 className="text-base font-semibold">Readiness score (0–100)</h3>
            <p className="mt-2 text-sm text-ink-700">
              Each of six sections scores on how completely its fields are written, measured against
              a guide word count, then loses:
            </p>
            <ul className="mt-2 space-y-1.5 text-sm text-ink-700">
              <li>· 15 points per finding needing attention</li>
              <li>· 5 points per advisory finding</li>
              <li>· capped at a 60-point deduction</li>
            </ul>
            <p className="mt-3 text-xs text-ink-500">
              The overall figure is the unweighted mean of the six sections. It measures form
              completion, nothing more.
            </p>
          </Card>
        </div>
      </section>

      {/* Rule catalogue ------------------------------------------------------ */}
      <section aria-labelledby="rules-heading" className="mt-12">
        <SectionHeading
          id="rules-heading"
          eyebrow="Audit"
          title={`The rule catalogue (${RULES.length} rules)`}
          description="Every finding in the product names one of these. Each entry states what the rule looks at, why it might matter, and where it is known to fail."
        />
        <nav aria-label="Rule categories" className="mb-6">
          <ul className="flex flex-wrap gap-2">
            {byKind.map((group) => (
              <li key={group.kind}>
                <a
                  href={`#${group.anchor}`}
                  className="inline-flex items-center gap-1.5 rounded border border-ink-300 bg-white px-3 py-1.5 text-sm font-medium text-ink-700 hover:bg-parchment-200"
                >
                  {KIND_LABELS[group.kind]}
                  <span className="font-mono text-xs text-ink-400">{group.rules.length}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-10">
          {byKind.map((group) => (
            <div key={group.kind} id={group.anchor} className="scroll-mt-32">
              <h3 className="mb-3 text-lg font-semibold">{KIND_LABELS[group.kind]}</h3>
              <ul className="space-y-4">
                {group.rules.map((rule) => (
                  <RuleCard key={rule.id} rule={rule} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Limitations --------------------------------------------------------- */}
      <section aria-labelledby="limitations-heading" className="mt-12">
        <SectionHeading
          id="limitations-heading"
          eyebrow="Honesty"
          title="What this prototype cannot do"
          description="Stated plainly, because a tool that models a governance workflow should be candid about its own limits."
        />
        <div className="space-y-4">
          {[
            {
              title: "The data is entirely fictional",
              body: `All ${DATASETS.length} datasets, their holders, access bodies, quality scores, cohort sizes, catalogue references and access conditions were invented for this project. The numbers are internally consistent so the product behaves plausibly, but they describe nothing real. No conclusion drawn from this catalogue transfers to any actual dataset.`,
            },
            {
              title: "It makes no legal or ethical determination",
              body: "The prototype does not assess lawfulness, does not interpret any regulation, and does not evaluate ethical acceptability. Where it mentions a legal basis it is repeating text a user typed or a fictional catalogue entry. Any real application needs advice from qualified legal advisers, a research ethics committee, and the competent data-access authority.",
            },
            {
              title: "Keyword matching is a weak proxy for meaning",
              body: "The relevance and minimisation rules work on string overlap against a hand-written English dictionary. They cannot tell that adherence is derivable from dispensing dates, cannot handle a question written in another language, and will both miss real matches and produce false ones. MIN-04 in particular flags variables used for confounding adjustment that the purpose statement never names — an expected and documented false positive.",
            },
            {
              title: "Readiness measures completion, not quality",
              body: "The score counts words and open findings. A well-written application full of nonsense would score highly; a terse, expert one might score poorly. It is a checklist aid, not an assessment.",
            },
            {
              title: "Roles are not enforced",
              body: "The researcher and reviewer views are a mock. There is no authentication, no authorisation and no separation of data between them — switching role changes which controls appear and nothing else. A real system would need genuine identity and access control.",
            },
            {
              title: "There is no persistence beyond this browser",
              body: "Everything lives in localStorage. There is no server, no backup and no sharing. Clearing site data deletes all your projects. This is deliberate for a public demo, but it is not how a real workspace would work.",
            },
            {
              title: "Compatibility is assessed on declared metadata only",
              body: "The rules read what the fictional catalogue says a holder declares. They cannot detect a linkage route that exists in practice but is not documented, and they cannot assess mapping depth behind a claimed common data model.",
            },
            {
              title: "No real interoperability",
              body: "There is no connection to any dataset API, catalogue standard, terminology server or secure processing environment. What a real implementation would require is set out in the case study.",
            },
          ].map((item) => (
            <Card key={item.title}>
              <h3 className="text-base font-semibold">{item.title}</h3>
              <p className="prose-body mt-2">{item.body}</p>
            </Card>
          ))}
        </div>
      </section>

      <div className="mt-10">
        <Callout tone="caution" title="Confirm everything with the relevant authorities">
          Guidance in this prototype is educational. It draws no legal conclusions and must not be
          relied on for a real application. Confirm requirements, legal basis, ethical approval and
          data availability with your own legal and ethical advisers and with the competent Health
          Data Access Body.{" "}
          <Link href="/learn#official-heading">Official European Commission sources are listed here</Link>.
        </Callout>
      </div>
    </div>
  );
}
