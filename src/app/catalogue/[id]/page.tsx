import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { DATASETS, getDataset } from "@/lib/data/datasets";
import { DOCUMENT_LABELS } from "@/lib/data/documents";
import {
  Badge,
  Card,
  Callout,
  DefinitionList,
  QualityMeter,
  SectionHeading,
  StatTile,
} from "@/components/ui/primitives";
import { coverageLabel, formatCohort } from "@/components/DatasetCard";
import { AddToProjectButton } from "@/app/catalogue/[id]/AddToProjectButton";
import { VariableTable } from "@/app/catalogue/[id]/VariableTable";

export function generateStaticParams() {
  return DATASETS.map((dataset) => ({ id: dataset.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const dataset = getDataset(id);
  if (!dataset) return { title: "Dataset not found" };
  return {
    title: `${dataset.acronym} — ${dataset.name}`,
    description: `${dataset.summary} Fictional dataset used in an independent portfolio prototype.`,
  };
}

const SENSITIVITY_TONE = {
  low: "neutral",
  moderate: "cyan",
  high: "caution",
  "direct-identifier": "critical",
} as const;

export default async function DatasetProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const dataset = getDataset(id);
  if (!dataset) notFound();

  const identifiers = dataset.variables.filter(
    (variable) => variable.sensitivity === "direct-identifier",
  );
  const meanCompleteness =
    dataset.variables.reduce((total, variable) => total + variable.completeness, 0) /
    dataset.variables.length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-ink-500">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/catalogue" className="hover:text-ink-800 hover:underline">
              Catalogue
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-ink-800">{dataset.acronym}</li>
        </ol>
      </nav>

      {/* Header ----------------------------------------------------------- */}
      <header className="surface p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge tone="cyan">{dataset.country}</Badge>
              <Badge
                tone={
                  dataset.accessComplexity === "Streamlined"
                    ? "positive"
                    : dataset.accessComplexity === "Complex"
                      ? "caution"
                      : "neutral"
                }
              >
                {dataset.accessComplexity} access
              </Badge>
              <Badge tone="gold">Fictional dataset</Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl">{dataset.name}</h1>
            <p className="mt-1 font-mono text-sm text-ink-500">
              {dataset.acronym} · {dataset.catalogueRef} · metadata updated {dataset.lastMetadataUpdate}
            </p>
            <p className="prose-body mt-3">{dataset.summary}</p>
          </div>
          <AddToProjectButton datasetId={dataset.id} label={`${dataset.acronym} — ${dataset.name}`} />
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="Coverage" value={coverageLabel(dataset)} detail={`${dataset.updateFrequency} updates`} />
          <StatTile
            label="Approx. cohort"
            value={`~${formatCohort(dataset.approximateCohortSize)}`}
            detail="people, fictional estimate"
          />
          <StatTile
            label="Variables"
            value={dataset.variables.length}
            detail={`${identifiers.length} direct identifier${identifiers.length === 1 ? "" : "s"}`}
            tone={identifiers.length > 0 ? "attention" : "neutral"}
          />
          <StatTile
            label="Mean field completeness"
            value={`${meanCompleteness.toFixed(1)}%`}
            detail="across all documented variables"
          />
        </div>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          {/* Variables --------------------------------------------------- */}
          <section aria-labelledby="variables-heading" className="surface p-6">
            <SectionHeading
              id="variables-heading"
              eyebrow="Content"
              title="Variables and coverage"
              description="Field-level completeness is the fictional percentage of records where the variable is populated. Sensitivity banding drives the data-minimisation assistant."
            />
            <VariableTable dataset={dataset} />
          </section>

          {/* Provenance --------------------------------------------------- */}
          <section aria-labelledby="provenance-heading" className="surface p-6">
            <SectionHeading
              id="provenance-heading"
              eyebrow="Trust"
              title="Provenance"
              description="Where the data comes from, how it is curated, and how current the documentation is."
            />
            <div className="trust-rule space-y-4">
              <DefinitionList
                columns={1}
                items={[
                  { term: "Data holder", description: dataset.holder },
                  { term: "Collection method", description: dataset.provenance.collectionMethod },
                  { term: "Curation process", description: dataset.provenance.curationProcess },
                  { term: "Versioning", description: dataset.provenance.versioning },
                  { term: "Last audited", description: dataset.provenance.lastAudited },
                  {
                    term: "Legal basis summary",
                    description: (
                      <>
                        {dataset.provenance.legalBasisSummary}{" "}
                        <span className="text-ink-500">
                          This is an educational description of a fictional arrangement and is not a
                          legal statement.
                        </span>
                      </>
                    ),
                  },
                ]}
              />
            </div>
          </section>

          {/* Purposes ------------------------------------------------------ */}
          <section aria-labelledby="purposes-heading" className="surface p-6">
            <SectionHeading
              id="purposes-heading"
              eyebrow="Governance"
              title="Permitted and prohibited purposes"
              description="What the fictional holder allows this dataset to be used for, and what it excludes outright."
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <h3 className="mb-2 text-sm font-semibold text-emerald-900">Permitted purposes</h3>
                <ul className="space-y-1.5">
                  {dataset.permittedPurposes.map((purpose) => (
                    <li key={purpose} className="flex gap-2 text-sm text-ink-700">
                      <span aria-hidden="true" className="text-emerald-600">
                        ✓
                      </span>
                      <span>{purpose}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="mb-2 text-sm font-semibold text-rose-900">Prohibited purposes</h3>
                <ul className="space-y-1.5">
                  {dataset.prohibitedPurposes.map((purpose) => (
                    <li key={purpose} className="flex gap-2 text-sm text-ink-700">
                      <span aria-hidden="true" className="text-rose-600">
                        ×
                      </span>
                      <span>{purpose}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* Limitations --------------------------------------------------- */}
          <section aria-labelledby="limitations-heading" className="surface p-6">
            <SectionHeading
              id="limitations-heading"
              eyebrow="Fitness for purpose"
              title="Known limitations"
              description="Stated up front rather than discovered halfway through an analysis."
            />
            <ul className="space-y-2">
              {dataset.knownLimitations.map((limitation) => (
                <li key={limitation} className="flex gap-2.5 text-sm text-ink-700">
                  <span aria-hidden="true" className="mt-0.5 text-amber-600">
                    !
                  </span>
                  <span>{limitation}</span>
                </li>
              ))}
            </ul>
            {dataset.quality.notes.length > 0 ? (
              <>
                <h3 className="mb-2 mt-5 text-sm font-semibold text-ink-800">Data-quality notes</h3>
                <ul className="space-y-2">
                  {dataset.quality.notes.map((note) => (
                    <li key={note} className="flex gap-2.5 text-sm text-ink-600">
                      <span aria-hidden="true" className="mt-0.5 text-ink-400">
                        ·
                      </span>
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </section>
        </div>

        {/* Sidebar ------------------------------------------------------- */}
        <div className="space-y-6">
          <Card>
            <h2 className="mb-4 text-base font-semibold">Data quality</h2>
            <div className="space-y-4">
              <QualityMeter
                label="Completeness"
                value={dataset.quality.completeness}
                description="Share of expected records and fields present."
              />
              <QualityMeter
                label="Timeliness"
                value={dataset.quality.timeliness}
                description="How quickly records become available after the event."
              />
              <QualityMeter
                label="Interoperability"
                value={dataset.quality.interoperability}
                description="Alignment with international terminologies."
              />
              <QualityMeter
                label="Consistency"
                value={dataset.quality.consistency}
                description="Stability of coding across the time series."
              />
              <QualityMeter
                label="Documentation"
                value={dataset.quality.documentation}
                tone="gold"
                description="Transparency of provenance and metadata."
              />
            </div>
            <p className="mt-4 text-xs text-ink-500">
              All scores are invented for this prototype. Real catalogues would derive comparable
              indicators from a published data-quality framework.
            </p>
          </Card>

          <Card>
            <h2 className="mb-3 text-base font-semibold">Linkage</h2>
            <Badge
              tone={
                dataset.linkage.status === "No linkage supported"
                  ? "critical"
                  : dataset.linkage.status === "National pseudonymous key available"
                    ? "positive"
                    : "caution"
              }
            >
              {dataset.linkage.status}
            </Badge>
            <p className="prose-body mt-3 text-sm">{dataset.linkage.notes}</p>
            {dataset.linkage.knownLinkedDatasets.length > 0 ? (
              <p className="mt-3 text-sm text-ink-700">
                Previously linked with:{" "}
                {dataset.linkage.knownLinkedDatasets.map((linkedId, index) => {
                  const linked = getDataset(linkedId);
                  return linked ? (
                    <span key={linkedId}>
                      {index > 0 ? ", " : ""}
                      <Link href={`/catalogue/${linked.id}`} className="font-medium text-cyan-800 hover:underline">
                        {linked.acronym}
                      </Link>
                    </span>
                  ) : null;
                })}
              </p>
            ) : null}
            <p className="mt-3 text-xs text-ink-500">
              Whether linkage is theoretically available is not the same as whether it would be
              permitted for your study. Confirm with the access body.
            </p>
          </Card>

          <Card>
            <h2 className="mb-3 text-base font-semibold">Access conditions</h2>
            <DefinitionList
              columns={1}
              items={[
                { term: "Access body", description: dataset.accessBody.name },
                { term: "Jurisdiction", description: dataset.accessBody.jurisdiction },
                {
                  term: "Indicative decision time",
                  description: `${dataset.accessBody.indicativeDecisionDays} working days (fictional)`,
                },
                {
                  term: "Secure processing environment",
                  description: dataset.accessConditions.secureProcessingEnvironmentRequired
                    ? "Required — analysis takes place inside the environment"
                    : "Not required for this dataset",
                },
                { term: "Output checking", description: dataset.accessConditions.outputChecking },
                {
                  term: "Minimum cell size",
                  description: `${dataset.accessConditions.minimumAggregationThreshold}`,
                },
                {
                  term: "Maximum access period",
                  description: `${dataset.accessConditions.maximumAccessMonths} months`,
                },
                { term: "Fee band", description: dataset.accessConditions.feeBand },
              ]}
            />
            <h3 className="mb-2 mt-5 text-sm font-semibold text-ink-800">Required documentation</h3>
            <ul className="space-y-1">
              {dataset.accessConditions.requiredDocuments.map((documentId) => (
                <li key={documentId} className="text-sm text-ink-700">
                  · {DOCUMENT_LABELS[documentId]}
                </li>
              ))}
            </ul>
          </Card>

          <Callout tone="caution" title="Educational content only">
            Every requirement, condition and turnaround time on this page is invented. Confirm the
            real position with the competent data-access authority and with your own legal and
            ethical advisers before relying on any of it.
          </Callout>
        </div>
      </div>

      {/* Related ----------------------------------------------------------- */}
      <section aria-labelledby="related-heading" className="mt-8">
        <SectionHeading
          id="related-heading"
          eyebrow="Catalogue"
          title="Other datasets in this disease area"
        />
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {DATASETS.filter(
            (candidate) =>
              candidate.id !== dataset.id &&
              candidate.diseaseAreas.some((area) => dataset.diseaseAreas.includes(area)),
          )
            .slice(0, 3)
            .map((related) => (
              <li key={related.id}>
                <Link href={`/catalogue/${related.id}`} className="group block">
                  <Card className="h-full transition-shadow hover:shadow-lift">
                    <p className="text-xs text-ink-500">{related.country}</p>
                    <h3 className="mt-1 text-sm font-semibold group-hover:text-cyan-800">
                      {related.name}
                    </h3>
                    <p className="mt-1.5 line-clamp-2 text-xs text-ink-600">{related.summary}</p>
                  </Card>
                </Link>
              </li>
            ))}
        </ul>
      </section>

      <p className="mt-8 text-xs text-ink-500">
        Sensitivity bands shown on this page:{" "}
        {(["low", "moderate", "high", "direct-identifier"] as const).map((band) => (
          <Badge key={band} tone={SENSITIVITY_TONE[band]} className="ml-1.5">
            {band}
          </Badge>
        ))}
      </p>
    </div>
  );
}
