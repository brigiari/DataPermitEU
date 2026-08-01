import type { Metadata } from "next";
import { EHDS_TIMELINE, GLOSSARY, OFFICIAL_LINKS } from "@/lib/data/learning";
import { Badge, Callout, Card, SectionHeading, cx } from "@/components/ui/primitives";
import { GlossarySearch } from "@/app/learn/GlossarySearch";

export const metadata: Metadata = {
  title: "EHDS timeline and glossary",
  description:
    "An educational timeline of the European Health Data Space and a glossary of secondary-use terminology, marking clearly which terms are real concepts and which are inventions of this prototype.",
};

const STATUS_TONE = {
  background: "neutral",
  adopted: "positive",
  "phased-application": "cyan",
} as const;

const STATUS_LABEL = {
  background: "Background",
  adopted: "In force",
  "phased-application": "Phasing in",
} as const;

export default function LearnPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <SectionHeading
        eyebrow="Educational"
        title="Understanding the European Health Data Space"
        description="This page describes the real, publicly documented European Health Data Space at a high level and links to official sources. It is the one part of this prototype that is not fiction — but it is still a summary written for a portfolio project, not authoritative guidance."
      />

      <Callout tone="caution" title="How to read this page">
        The timeline and glossary below summarise real developments and real concepts. Everything
        else in DataPermit EU — the datasets, the access bodies, the requirements, the approvals — is
        invented. Where a glossary entry describes something this prototype made up, it is labelled
        as such. For anything that matters, go to the official sources listed at the bottom.
      </Callout>

      {/* Timeline ----------------------------------------------------------- */}
      <section aria-labelledby="timeline-heading" className="mt-10">
        <SectionHeading
          id="timeline-heading"
          eyebrow="Context"
          title="How the EHDS came about"
          description="A high-level chronology. Dates and obligations for any specific requirement should be checked against the official text rather than this summary."
        />
        <ol className="relative space-y-6 border-l-2 border-ink-200 pl-6">
          {EHDS_TIMELINE.map((entry) => (
            <li key={entry.title} className="relative">
              <span
                aria-hidden="true"
                className={cx(
                  "absolute -left-[1.9375rem] top-1.5 h-3 w-3 rounded-full border-2 border-white",
                  entry.status === "adopted"
                    ? "bg-emerald-500"
                    : entry.status === "phased-application"
                      ? "bg-cyan-500"
                      : "bg-ink-300",
                )}
              />
              <Card>
                <div className="mb-1.5 flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-gold-700">{entry.period}</span>
                  <Badge tone={STATUS_TONE[entry.status]}>{STATUS_LABEL[entry.status]}</Badge>
                </div>
                <h3 className="text-base font-semibold">{entry.title}</h3>
                <p className="prose-body mt-2">{entry.body}</p>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      {/* Why it matters ------------------------------------------------------ */}
      <section aria-labelledby="why-heading" className="mt-12">
        <SectionHeading
          id="why-heading"
          eyebrow="The problem"
          title="Why secondary access is hard"
          description="The obstacles this prototype is designed around. None of them is primarily a technology problem."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            {
              title: "Discovery is fragmented",
              body: "There is no single place to find out what health data exists across Europe, in what form, for which years. Researchers rely on personal networks, published papers and word of mouth — which systematically favours those already inside the network.",
            },
            {
              title: "Fitness for purpose is hard to judge in advance",
              body: "A dataset can cover the right disease area and still be unusable: the key variable missing for the years you need, a coding change mid-series, a population that excludes exactly the people you are studying. This is usually discovered after the permit is granted.",
            },
            {
              title: "Requirements differ by holder",
              body: "Two datasets in the same country can want different documentation. Add a third from another member state and the requirements multiply, along with the number of bodies who must each say yes.",
            },
            {
              title: "Minimisation is asserted, not demonstrated",
              body: "Applications typically assert that the request is minimal. Very few show the working per variable — which is what a reviewer actually needs in order to agree.",
            },
            {
              title: "Terminology does not align",
              body: "ICD-10 against ICD-11, SNOMED CT against a local scheme with no published crosswalk. Harmonisation work is real, expensive, and routinely discovered late.",
            },
            {
              title: "The reasoning is lost",
              body: "Why a variable was requested, why a dataset was dropped, why a caution was overruled — this reasoning lives in email threads and people's memories, and disappears when they move on.",
            },
          ].map((item) => (
            <Card key={item.title}>
              <h3 className="text-base font-semibold">{item.title}</h3>
              <p className="prose-body mt-2">{item.body}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Glossary ------------------------------------------------------------ */}
      <section aria-labelledby="glossary-heading" className="mt-12">
        <SectionHeading
          id="glossary-heading"
          eyebrow="Reference"
          title={`Glossary (${GLOSSARY.length} terms)`}
          description="Terms you will meet in a secondary-use application. Entries marked as prototype inventions describe things that exist only in DataPermit EU."
        />
        <GlossarySearch entries={GLOSSARY} />
      </section>

      {/* Official links ------------------------------------------------------ */}
      <section aria-labelledby="official-heading" className="mt-12">
        <SectionHeading
          id="official-heading"
          eyebrow="Sources"
          title="Official European Commission and EU materials"
          description="Go here rather than to this prototype for anything you need to rely on."
        />
        <ul className="space-y-3">
          {OFFICIAL_LINKS.map((link) => (
            <li key={link.url}>
              <Card>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer external"
                  className="text-base font-semibold text-cyan-800 hover:underline"
                >
                  {link.label}
                  <span className="sr-only"> (opens in a new tab)</span>
                  <span aria-hidden="true" className="ml-1 text-sm">
                    ↗
                  </span>
                </a>
                <p className="prose-body mt-1">{link.note}</p>
                <p className="mt-1 break-all font-mono text-xs text-ink-400">{link.url}</p>
              </Card>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
