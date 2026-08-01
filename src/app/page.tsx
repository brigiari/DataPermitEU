import Link from "next/link";
import { Badge, Card, LinkButton, SectionHeading } from "@/components/ui/primitives";
import { DisclaimerPanel } from "@/components/PrototypeDisclaimer";
import { DATASETS } from "@/lib/data/datasets";
import { RULES } from "@/lib/recommendations/rules";

const WORKFLOW = [
  {
    step: "01",
    title: "Describe the question",
    body: "A project starts with a research question in plain language. Everything downstream — relevance ranking, minimisation review, readiness scoring — reads from it.",
    href: "/projects",
    linkLabel: "Open the project dashboard",
  },
  {
    step: "02",
    title: "Search the catalogue",
    body: "Ten facets over a fictional catalogue: country, disease area, record type, population, coverage, cadence, terminology, access body, cohort size and quality floors.",
    href: "/catalogue",
    linkLabel: "Browse the catalogue",
  },
  {
    step: "03",
    title: "Read the dataset properly",
    body: "Each profile shows variables, provenance, completeness, permitted and prohibited purposes, access conditions, known limitations, and whether linkage is even theoretically possible.",
    href: "/catalogue/scor-se",
    linkLabel: "See an example profile",
  },
  {
    step: "04",
    title: "Compare what you selected",
    body: "A pairwise compatibility view: shared coverage, linkage routes, terminology conflicts, and which holder's conditions will end up governing the whole project.",
    href: "/projects/demo-adherence-readmission/compare",
    linkLabel: "Open the comparison workspace",
  },
  {
    step: "05",
    title: "Build the application",
    body: "A guided, autosaving builder covering purpose, public interest, variables, population, analysis plan, documentation, duration and expected outputs.",
    href: "/projects/demo-adherence-readmission/application",
    linkLabel: "Open the application builder",
  },
  {
    step: "06",
    title: "Review, then export",
    body: "Data minimisation and readiness reviews flag what a reviewer would query, with a reason attached to every finding. Export a structured application and an audit trail.",
    href: "/projects/demo-adherence-readmission/readiness",
    linkLabel: "Open the readiness dashboard",
  },
];

const PRINCIPLES = [
  {
    title: "Every recommendation shows its working",
    body: "No finding appears without a plain-language reason, the evidence behind it, and the identifier of the rule that produced it. The full rule catalogue is published on the methodology page — all " + RULES.length + " of them.",
  },
  {
    title: "Nothing here decides anything",
    body: "The prototype produces prompts for a person to consider. It draws no legal conclusions, makes no approval predictions, and states on every surface that guidance is educational and must be confirmed with the relevant authorities.",
  },
  {
    title: "Minimisation is per-variable, not per-form",
    body: "Data minimisation only becomes real when it operates on individual fields. The assistant reviews each requested variable against the stated purpose and asks for a justification where one is missing.",
  },
  {
    title: "The data never leaves your browser",
    body: "No backend, no accounts, no analytics, no third-party requests. Demo state lives in localStorage and is yours to clear. A tool that models a privacy-sensitive workflow should behave that way itself.",
  },
];

export default function LandingPage() {
  const countries = new Set(DATASETS.map((dataset) => dataset.country));
  const variables = DATASETS.reduce((total, dataset) => total + dataset.variables.length, 0);

  return (
    <div>
      {/* Hero ------------------------------------------------------------- */}
      <section className="relative overflow-hidden border-b border-ink-200 bg-ink-950">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 18% 20%, #1aa3cf 0, transparent 42%), radial-gradient(circle at 82% 12%, #385076 0, transparent 46%), radial-gradient(circle at 62% 88%, #e1ae3a 0, transparent 38%)",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="max-w-3xl">
            <Badge tone="gold" className="mb-5">
              Independent fictional portfolio prototype
            </Badge>
            <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight text-parchment-50 sm:text-5xl">
              From a research question to a defensible data-access application.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-200">
              Researchers seeking secondary access to European health data have to work out which
              datasets exist, whether any of them actually fit the question, what documentation each
              holder wants, and how to ask for the least data that will answer it. DataPermit EU is a
              design exploration of what a workspace for that job could look like.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <LinkButton href="/projects/demo-adherence-readmission" variant="on-dark-primary">
                Follow the worked example
              </LinkButton>
              <LinkButton href="/catalogue" variant="on-dark">
                Explore the catalogue
              </LinkButton>
            </div>

            <dl className="mt-12 grid max-w-2xl grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-4">
              {[
                { label: "Fictional datasets", value: DATASETS.length },
                { label: "Countries", value: countries.size },
                { label: "Documented variables", value: variables },
                { label: "Published rules", value: RULES.length },
              ].map((stat) => (
                <div key={stat.label}>
                  <dt className="text-xs uppercase tracking-wide text-ink-400">{stat.label}</dt>
                  <dd className="mt-1 font-mono text-2xl font-semibold tabular-nums text-cyan-300">
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* Disclaimer ------------------------------------------------------- */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <DisclaimerPanel />
      </div>

      {/* Workflow --------------------------------------------------------- */}
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6" aria-labelledby="workflow-heading">
        <SectionHeading
          id="workflow-heading"
          eyebrow="The workflow"
          title="Six steps, one continuous record"
          description="Each step writes to the same project, and every change is appended to an audit trail you can export. The point is that the reasoning behind an application survives the application."
        />
        <ol className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {WORKFLOW.map((item) => (
            <li key={item.step}>
              <Card className="flex h-full flex-col">
                <span className="font-mono text-xs font-semibold text-gold-600">{item.step}</span>
                <h3 className="mt-2 text-base font-semibold">{item.title}</h3>
                <p className="prose-body mt-2 flex-1">{item.body}</p>
                <Link
                  href={item.href}
                  className="mt-4 text-sm font-medium text-cyan-800 hover:underline"
                >
                  {item.linkLabel} <span aria-hidden="true">→</span>
                </Link>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      {/* Principles ------------------------------------------------------- */}
      <section
        className="mx-auto max-w-7xl px-4 py-12 sm:px-6"
        aria-labelledby="principles-heading"
      >
        <SectionHeading
          id="principles-heading"
          eyebrow="Design commitments"
          title="What the recommendation layer will and will not do"
          description={
            <>
              The intelligent features are deliberately unglamorous: deterministic rules over
              catalogue metadata and application text. They are kept behind a provider interface so a
              language model or terminology service could replace them later without changing a line
              of interface code — but the constraints below would still apply to whatever replaced
              them.
            </>
          }
        />
        <div className="grid gap-4 sm:grid-cols-2">
          {PRINCIPLES.map((principle) => (
            <Card key={principle.title} className="trust-rule border-l-2 border-l-gold-400">
              <h3 className="text-base font-semibold">{principle.title}</h3>
              <p className="prose-body mt-2">{principle.body}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Worked example --------------------------------------------------- */}
      <section className="border-y border-ink-200 bg-white" aria-labelledby="demo-heading">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="eyebrow mb-2">Preloaded demo project</p>
              <h2 id="demo-heading" className="text-2xl sm:text-3xl">
                Medication adherence and cardiovascular readmission
              </h2>
              <p className="prose-body mt-4">
                A worked example you can follow end to end. A researcher asks whether poor adherence
                to secondary-prevention medication after an acute coronary event predicts unplanned
                readmission. Two Swedish registers hold the exposure and the outcome; a Finnish
                repository was added as a possible replication cohort and turns out to raise problems.
              </p>
              <p className="prose-body mt-3">
                The application is deliberately imperfect. It requests an exact date of birth where a
                birth year would do, a household income decile with no justification at all, and a
                prescriber identifier that the analysis plan never mentions. The minimisation
                assistant finds all three, and the reviewer view shows what a colleague would say
                about them.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <LinkButton href="/projects/demo-adherence-readmission" variant="primary">
                  Open the project
                </LinkButton>
                <LinkButton href="/projects/demo-adherence-readmission/minimisation">
                  Jump to the minimisation review
                </LinkButton>
              </div>
            </div>

            <Card className="bg-parchment-50">
              <p className="eyebrow mb-3">What the rules flag on this project</p>
              <ul className="space-y-3 text-sm">
                {[
                  {
                    rule: "MIN-01",
                    text: "Exact date of birth is classified as a direct identifier, and the holder publishes a birth-year default.",
                  },
                  {
                    rule: "MIN-03",
                    text: "Household income decile is high-sensitivity and carries no justification at all.",
                  },
                  {
                    rule: "MIN-04",
                    text: "Nothing in the purpose or analysis plan explains why a prescriber identifier is needed.",
                  },
                  {
                    rule: "CMP-01",
                    text: "Cross-border linkage between the Finnish repository and the Swedish registers is not established.",
                  },
                  {
                    rule: "TRM-01",
                    text: "The Finnish repository codes diagnoses in ICD-11 while the Swedish register uses ICD-10.",
                  },
                  {
                    rule: "MIS-08",
                    text: "No variables have been requested from the Finnish repository at all.",
                  },
                ].map((item) => (
                  <li key={item.rule} className="flex gap-3">
                    <span className="mt-0.5 font-mono text-xs font-semibold text-cyan-800">
                      {item.rule}
                    </span>
                    <span className="text-ink-700">{item.text}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* Closing ---------------------------------------------------------- */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              href: "/learn",
              title: "Understand the context",
              body: "A timeline of how the European Health Data Space came about, and a glossary that marks clearly which terms are real concepts and which were invented here.",
            },
            {
              href: "/methodology",
              title: "Audit the reasoning",
              body: "Every rule published in full, with its signal, its rationale and its documented weaknesses. Including the ones that produce false positives.",
            },
            {
              href: "/case-study",
              title: "Read the case study",
              body: "The product thinking: the access problem, the user journey, why minimisation drove the design, and what real EHDS interoperability would actually require.",
            },
          ].map((item) => (
            <Link key={item.href} href={item.href} className="group">
              <Card className="h-full transition-shadow hover:shadow-lift">
                <h3 className="text-base font-semibold group-hover:text-cyan-800">{item.title}</h3>
                <p className="prose-body mt-2">{item.body}</p>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
