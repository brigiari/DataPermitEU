import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Callout, Card, LinkButton, SectionHeading } from "@/components/ui/primitives";
import { DATASETS } from "@/lib/data/datasets";
import { RULES } from "@/lib/recommendations/rules";

export const metadata: Metadata = {
  title: "Portfolio case study",
  description:
    "The product thinking behind DataPermit EU: the research-access problem, the user journey, the role of data minimisation, trust and explainability choices, institutional stakeholders, prototype limitations, and what real EHDS interoperability would require.",
};

function Contents() {
  const sections = [
    ["problem", "The problem"],
    ["journey", "User journey and product decisions"],
    ["minimisation", "The role of data minimisation"],
    ["trust", "Trust and explainability choices"],
    ["stakeholders", "Likely institutional stakeholders"],
    ["limitations", "Limitations of the prototype"],
    ["interoperability", "What real EHDS interoperability would require"],
    ["engineering", "Engineering notes"],
  ] as const;
  return (
    <nav aria-label="Case study contents" className="surface-muted mb-10 p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500">Contents</h2>
      <ol className="mt-3 grid gap-1.5 sm:grid-cols-2">
        {sections.map(([anchor, label], index) => (
          <li key={anchor}>
            <a href={`#${anchor}`} className="text-sm text-cyan-800 hover:underline">
              <span className="mr-1.5 font-mono text-xs text-ink-400">
                {String(index + 1).padStart(2, "0")}
              </span>
              {label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function Section({
  id,
  eyebrow,
  title,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="scroll-mt-32 border-t border-ink-200 pt-10">
      <p className="eyebrow mb-1.5">{eyebrow}</p>
      <h2 id={`${id}-heading`} className="text-2xl">
        {title}
      </h2>
      <div className="prose-body mt-4 max-w-3xl space-y-4 text-[1rem]">{children}</div>
    </section>
  );
}

export default function CaseStudyPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <header className="mb-8">
        <Badge tone="gold" className="mb-3">
          Portfolio case study
        </Badge>
        <h1 className="text-3xl sm:text-4xl">
          Designing a workspace for European health-data access
        </h1>
        <p className="prose-body mt-4 max-w-3xl text-lg">
          DataPermit EU is an independent prototype exploring a specific question: what would it take
          to move a researcher from a research question to a well-formed, privacy-conscious
          data-access application, without losing the reasoning along the way? This is an account of
          the product decisions, what they were trying to solve, and where the prototype stops.
        </p>
        <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-3">
          {[
            { term: "Role", value: "Product design and full-stack engineering" },
            { term: "Stack", value: "Next.js, TypeScript, Tailwind CSS, Vitest" },
            { term: "Scope", value: `${DATASETS.length} fictional datasets, ${RULES.length} published rules` },
            { term: "Status", value: "Design prototype — not a production system" },
          ].map((item) => (
            <div key={item.term}>
              <dt className="text-xs uppercase tracking-wide text-ink-500">{item.term}</dt>
              <dd className="mt-0.5 text-sm font-medium text-ink-800">{item.value}</dd>
            </div>
          ))}
        </dl>
      </header>

      <Contents />

      <Section id="problem" eyebrow="01" title="The research-access problem">
        <p>
          A researcher with a good question and the skills to answer it can still be stopped by
          logistics. To get secondary access to European health data they need to work out which
          datasets exist, whether any of them actually contain what the question needs, which
          authority decides, what documentation that authority wants, and how to ask for the minimum
          data that will still answer the question. None of that is a research skill, and most of it
          is not written down in one place.
        </p>
        <p>
          The consequences are uneven rather than uniform. Researchers embedded in established
          networks learn what exists by asking a colleague. Those outside — early-career researchers,
          people at smaller institutions, teams in member states with less developed infrastructure —
          face the same questions with no informal channel to answer them. The result is that access
          correlates with network position rather than with the quality of the question, which is
          precisely the outcome a public-interest data space should be trying to avoid.
        </p>
        <p>
          The European Health Data Space addresses a large part of this at the level of law and
          infrastructure: designated access bodies, defined permitted purposes, secure processing
          environments, a cross-border route. What it does not do, and is not meant to do, is help an
          individual researcher reason their way through a specific application. That gap is what
          this prototype explores.
        </p>
        <Callout tone="caution" title="A note on scope">
          This is a design exploration built on invented data. It is not affiliated with, endorsed
          by, or connected to the European Commission, the EHDS, HealthData@EU or any national Health
          Data Access Body, and nothing it produces has standing in any real process.
        </Callout>
      </Section>

      <Section id="journey" eyebrow="02" title="User journey and product decisions">
        <p>
          The journey runs question → discovery → assessment → comparison → application → review →
          export. Five decisions shaped how it works.
        </p>

        <h3 className="text-lg font-semibold text-ink-900">The research question is the spine</h3>
        <p>
          A project cannot exist without one, and it is not decorative: relevance scoring reads it,
          the minimisation rules read it to judge whether a variable has a visible role, and the
          purpose-concern rules read it for wording a reviewer would query. Making it structurally
          central means a vague question produces visibly worse guidance — which is itself useful
          feedback, and closer to the truth than a tool that behaves identically regardless of what
          it is told.
        </p>

        <h3 className="text-lg font-semibold text-ink-900">
          Dataset profiles lead with limitations, not marketing
        </h3>
        <p>
          The profile pages give known limitations, quality caveats and prohibited purposes the same
          prominence as coverage and cohort size. A catalogue that only advertises strengths pushes
          the discovery of problems past the point where they are cheap to act on. Learning that a
          key variable is 41% complete, or that a coding scheme changed mid-series, is far more
          valuable before a permit application than after one.
        </p>

        <h3 className="text-lg font-semibold text-ink-900">
          Comparison is about combination, not ranking
        </h3>
        <p>
          The comparison workspace does not tell you which dataset is better. It tells you what
          happens when you put two together: whether records can be linked at all, which years both
          cover, whether they speak a common terminology, and whose access conditions will end up
          governing the whole project. The governing-constraints panel exists because the discovery
          that the strictest holder&apos;s minimum cell size applies to every output is one that
          researchers routinely make far too late.
        </p>

        <h3 className="text-lg font-semibold text-ink-900">
          The justification box sits next to the variable
        </h3>
        <p>
          The single most consequential layout decision in the product. An application with one
          free-text box for &ldquo;why you need this data&rdquo; produces a paragraph of general
          reasoning. A justification field attached to each selected variable produces per-field
          argument — which is what a reviewer actually needs, and what makes minimisation assessable
          rather than asserted. Putting the box there is what makes people write it.
        </p>

        <h3 className="text-lg font-semibold text-ink-900">Guidance arrives while writing</h3>
        <p>
          Findings for the current step appear beside the fields rather than in a validation pass at
          the end. Feedback at the point of writing is feedback you can act on; feedback at
          submission time is a list of chores. The cost is that findings churn as you type, which the
          debounced autosave and stable sort order are there to contain.
        </p>
      </Section>

      <Section id="minimisation" eyebrow="03" title="The role of data minimisation">
        <p>
          Data minimisation is the principle that the personal data processed should be limited to
          what is necessary. In most applications it appears as a sentence asserting that the request
          is minimal. That assertion is unfalsifiable and therefore useless to a reviewer.
        </p>
        <p>
          This prototype treats minimisation as the organising principle of the whole scope section
          rather than a compliance checkbox. Three mechanisms do the work.
        </p>
        <p>
          <strong>Per-variable justification.</strong> Every selected variable carries its own
          justification field, and high-sensitivity variables with a thin or absent one are flagged
          immediately in the selector, not later.
        </p>
        <p>
          <strong>Granularity as a first-class choice.</strong> Catalogue variables can declare a
          coarser default — a birth year instead of an exact date, a NUTS-3 region instead of a full
          postcode. The request records which form you asked for, and MIN-02 flags cases where a
          coarser form exists and full detail was requested anyway. This reframes minimisation from a
          binary include-or-exclude decision into a question of how much detail is genuinely needed,
          which is usually the more productive conversation.
        </p>
        <p>
          <strong>Purpose-linked review.</strong> MIN-04 checks whether a variable&apos;s analytical
          category appears anywhere in the stated purpose or analysis plan. This rule is deliberately
          noisy, and the interface says so: confounder adjustment routinely needs variables the
          purpose never mentions. It is not there to be right. It is there to prompt the researcher
          to write down a reason, which is exactly what the reviewer will want.
        </p>
        <p>
          The demo project is built to demonstrate this honestly. It requests an exact date of birth
          where a birth year would do, a household income decile with no justification at all, and a
          prescriber identifier the analysis plan never mentions. A demo where the assistant finds
          nothing would prove nothing.
        </p>
      </Section>

      <Section id="trust" eyebrow="04" title="Trust and explainability choices">
        <p>
          The product makes recommendations about privacy-sensitive decisions in a governance
          context. Four commitments follow from that, and they constrained the engineering as much as
          the copy.
        </p>
        <p>
          <strong>No unexplained findings.</strong> Every recommendation carries a plain-language
          reason, the evidence behind it, and the identifier of the rule that produced it. Expanding
          a finding shows the rule&apos;s signal and its documented weaknesses. All {RULES.length}{" "}
          rules are published in full on the{" "}
          <Link href="/methodology">methodology page</Link>, including the ones that are known to
          produce false positives.
        </p>
        <p>
          <strong>The tool never decides.</strong> No finding removes a variable, changes a field, or
          blocks a step. Every one can be dismissed. Dismissals are written to the audit trail with a
          timestamp rather than quietly dropped — which keeps the user in control while keeping the
          record honest about what was considered and set aside.
        </p>
        <p>
          <strong>No legal conclusions.</strong> The product never states that something is lawful,
          compliant or approvable. Where it touches a legal question it describes what a fictional
          holder declares, or repeats what the user typed, and it says on every relevant surface that
          confirmation must come from the relevant legal, ethical and data-access authorities.
        </p>
        <p>
          <strong>Scores are bounded and explained.</strong> Three numbers appear in the product —
          relevance, compatibility and readiness — and every one has its arithmetic published. The
          readiness score is labelled repeatedly as a measure of form completion rather than a
          prediction of approval, because a number in a governance interface will be read as a
          prediction unless it is actively prevented from being one.
        </p>
        <p>
          The recommendation layer is separated behind a provider interface partly for architectural
          reasons and partly as a statement about what would have to remain true if a language model
          replaced the rules. The interface requires a reason and an evidence array on every result.
          A model-backed implementation that could not populate them honestly would fail to satisfy
          the type, which is a small piece of governance encoded in a type signature.
        </p>
      </Section>

      <Section id="stakeholders" eyebrow="05" title="Likely institutional stakeholders">
        <div className="not-prose grid gap-4 sm:grid-cols-2">
          {[
            {
              who: "Researchers and research teams",
              need: "To find out quickly whether a question is answerable with available data, and to produce an application that survives review.",
              tension: "Want breadth and flexibility; the process rewards precision and narrowness.",
            },
            {
              who: "Health Data Access Bodies",
              need: "Complete, consistent, assessable applications that do not require three rounds of clarification.",
              tension: "Cannot advise applicants extensively without compromising their independence as decision-makers.",
            },
            {
              who: "Data holders",
              need: "Confidence that their data is used within permitted purposes and that quality caveats are understood.",
              tension: "Bear the support cost of every application, approved or not.",
            },
            {
              who: "Data protection officers and legal advisers",
              need: "A clear, documented record of what was requested and why, and evidence that minimisation was genuinely considered.",
              tension: "Consulted late, when the design is already fixed.",
            },
            {
              who: "Research ethics committees",
              need: "To see the study design and the data request as one coherent whole.",
              tension: "Often review the protocol without visibility of the eventual data request.",
            },
            {
              who: "Patients and the public",
              need: "Confidence that data about them is used for public benefit, minimally, and never for purposes they would object to.",
              tension: "Almost never in the room when any of these decisions are made.",
            },
            {
              who: "Secure processing environment operators",
              need: "Predictable requirements and workable output-checking arrangements.",
              tension: "Sit between researcher deadlines and holder caution.",
            },
            {
              who: "Funders",
              need: "Projects that deliver within their funding period.",
              tension: "Funding timelines rarely accommodate multi-jurisdiction access timelines.",
            },
          ].map((item) => (
            <Card key={item.who}>
              <h3 className="text-sm font-semibold">{item.who}</h3>
              <p className="mt-2 text-sm text-ink-700">
                <span className="font-medium text-ink-800">Needs:</span> {item.need}
              </p>
              <p className="mt-1.5 text-sm text-ink-600">
                <span className="font-medium text-ink-800">Tension:</span> {item.tension}
              </p>
            </Card>
          ))}
        </div>
        <p className="mt-5">
          The design tries to sit in the gap this creates. An access body cannot coach an applicant
          without compromising its own independence, but a neutral tool can help an applicant
          anticipate what will be asked — which serves both sides, provided it never pretends to
          speak for the body.
        </p>
      </Section>

      <Section id="limitations" eyebrow="06" title="Limitations of the prototype">
        <p>
          Full detail is on the <Link href="/methodology#limitations-heading">methodology page</Link>
          . The short version:
        </p>
        <ul className="not-prose space-y-2.5 text-[0.9375rem] text-ink-700">
          {[
            "Every dataset, holder, access body, requirement and quality score is invented. Nothing transfers to a real dataset.",
            "The recommendation layer is string matching against a hand-written English dictionary. It misses real matches and produces false ones, and MIN-04 is documented as noisy by design.",
            "Readiness measures form completion, not quality. A fluent application full of nonsense would score well.",
            "Roles are cosmetic. There is no authentication, authorisation or data separation between researcher and reviewer.",
            "Persistence is localStorage only. No server, no backup, no sharing, no multi-device.",
            "Compatibility is assessed on declared metadata. Undocumented linkage routes are invisible to it, and a claimed common-data-model mapping says nothing about mapping depth.",
            "There is no connection to any real catalogue, terminology server, dataset API or secure processing environment.",
          ].map((item) => (
            <li key={item} className="flex gap-2.5">
              <span aria-hidden="true" className="mt-1 text-amber-600">
                ·
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        id="interoperability"
        eyebrow="07"
        title="What real EHDS interoperability would require"
      >
        <p>
          Turning this from a design prototype into something that could sit alongside real
          infrastructure would need work in seven areas, roughly in this order.
        </p>
        <div className="not-prose mt-4 space-y-4">
          {[
            {
              title: "Machine-readable dataset metadata",
              body: "The catalogue would have to be populated from real holder metadata rather than hand-authored. That means adopting a shared metadata schema — DCAT-AP for discovery, with a health extension for coverage, quality and access conditions — and building ingestion for holders who publish nothing structured at all, which today is most of them.",
            },
            {
              title: "A terminology service",
              body: "The terminology rules currently compare declared coding-system labels. Real conflict detection needs a server that can reason about concepts: SNOMED CT and LOINC endpoints, published ICD-10 to ICD-11 crosswalks, and honest reporting of what a mapping loses. This is the single largest gap between the prototype and something useful.",
            },
            {
              title: "Authentication and researcher accreditation",
              body: "Real identity, tied to institutional affiliation and to whatever accreditation each holder requires. Likely federated through existing research identity infrastructure rather than built fresh, with the access body — not the tool — remaining the authority on who is accredited.",
            },
            {
              title: "Dataset and permit APIs",
              body: "Submission would need to reach each access body's own system, in their format, with status flowing back. Given that these systems differ per member state, an adapter layer per jurisdiction is realistic and a single universal API is not.",
            },
            {
              title: "Secure processing environment integration",
              body: "Once a permit is granted the work moves into an environment the researcher does not control. A workspace like this would need to hand over cleanly: provisioning, the approved variable list as an actual data specification, and output-checking requests routed back through the holder.",
            },
            {
              title: "Multilingual interfaces",
              body: "Not only interface translation but multilingual concept matching, since a research question written in Finnish must match a catalogue described in English. This is a terminology problem more than a localisation one, and the current English-only dictionary would have to go.",
            },
            {
              title: "Cross-border coordination",
              body: "HealthData@EU is designed to coordinate multi-country requests. A workspace should model that route rather than assume parallel national applications — which is what the current compatibility rules assume, and say they assume.",
            },
          ].map((item, index) => (
            <Card key={item.title}>
              <div className="flex gap-4">
                <span className="font-mono text-sm font-semibold text-gold-600">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="text-base font-semibold">{item.title}</h3>
                  <p className="prose-body mt-1.5">{item.body}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
        <p className="mt-5">
          One thing would have to stay constant through all of it. The moment a tool like this starts
          producing findings a user cannot interrogate, or that read as decisions rather than
          prompts, it stops helping people reason and starts making decisions on their behalf in a
          domain where that is not acceptable.
        </p>
      </Section>

      <Section id="engineering" eyebrow="08" title="Engineering notes">
        <p>
          Next.js App Router with TypeScript throughout. Static content — the catalogue, dataset
          profiles, the educational and methodology pages — is server-rendered; anything touching
          workspace state is a client island, so a dataset profile stays cacheable while the
          add-to-project control is interactive.
        </p>
        <p>
          State is a single reducer over a workspace object, persisted to localStorage on a debounced
          autosave. Routing every mutation through the reducer is what makes the audit trail
          trustworthy: an action that changes the application also writes its own log entry, so the
          two cannot drift apart. The whole recommendation engine is pure functions over that state,
          which means it needs no mocking to test and recomputes cheaply enough to run on every
          change.
        </p>
        <p>
          Faceted search is synchronous over an in-memory catalogue, with facet counts computed
          against the results of all <em>other</em> facets so a zero-count option genuinely means a
          dead end. At this catalogue size a search index would be premature; the deferred value on
          the query input is the concession to responsiveness.
        </p>
        <p>
          Accessibility was treated as a constraint rather than a pass at the end: one focus
          treatment that is never removed, meters carrying explicit ARIA values so bar widths are not
          the only signal, sortable tables announcing sort state, live regions on result counts, and
          reduced-motion honoured globally. Detail is in{" "}
          <code className="rounded bg-ink-100 px-1 py-0.5 font-mono text-xs">docs/ACCESSIBILITY.md</code>.
        </p>
        <p>
          Tests concentrate on the recommendation rules and the store, because that is where the
          product&apos;s claims live. A rule that fires when it should not is a worse failure here
          than a layout bug.
        </p>
      </Section>

      <div className="mt-12 flex flex-wrap gap-3 border-t border-ink-200 pt-8">
        <LinkButton href="/projects/demo-adherence-readmission" variant="primary">
          Open the worked example
        </LinkButton>
        <LinkButton href="/methodology">Read the full methodology</LinkButton>
        <LinkButton href="/catalogue">Explore the catalogue</LinkButton>
      </div>
    </div>
  );
}
