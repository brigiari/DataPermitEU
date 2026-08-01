"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ProjectShell } from "@/components/ProjectShell";
import { RecommendationCard } from "@/components/RecommendationCard";
import {
  Badge,
  Card,
  Callout,
  EmptyState,
  LinkButton,
  QualityMeter,
  SectionHeading,
  cx,
} from "@/components/ui/primitives";
import {
  compatibilityMatrix,
  governingConstraints,
  intersectCoverage,
} from "@/lib/recommendations/compatibility";
import { coverageLabel, formatCohort } from "@/components/DatasetCard";
import type { Dataset } from "@/lib/types";

export function CompareWorkspace({ projectId }: { projectId: string }) {
  return (
    <ProjectShell projectId={projectId}>
      {({ project, datasets, findings, dispatch }) => {
        const relevant = findings.filter(
          (finding) =>
            finding.kind === "cross-dataset-compatibility" || finding.kind === "terminology-conflict",
        );
        return (
          <CompareBody
            projectId={project.id}
            datasets={datasets}
            findings={relevant}
            onDismiss={(finding) =>
              dispatch({
                type: "dismiss-recommendation",
                projectId: project.id,
                recommendationId: finding.id,
                title: finding.title,
                now: new Date().toISOString(),
              })
            }
          />
        );
      }}
    </ProjectShell>
  );
}

function CompareBody({
  projectId,
  datasets,
  findings,
  onDismiss,
}: {
  projectId: string;
  datasets: Dataset[];
  findings: Parameters<typeof RecommendationCard>[0]["finding"][];
  onDismiss: (finding: Parameters<typeof RecommendationCard>[0]["finding"]) => void;
}) {
  const matrix = useMemo(() => compatibilityMatrix(datasets), [datasets]);
  const coverage = useMemo(() => (datasets.length > 0 ? intersectCoverage(datasets) : null), [datasets]);
  const constraints = useMemo(
    () => (datasets.length > 0 ? governingConstraints(datasets) : null),
    [datasets],
  );

  if (datasets.length < 2) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <EmptyState
          title="Add at least two datasets to compare them"
          description="The comparison workspace looks at how datasets combine: whether records can be linked, whether their coverage overlaps, whether they speak the same terminology, and whose access conditions will govern the project."
          action={<LinkButton href="/catalogue" variant="primary">Search the catalogue</LinkButton>}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <SectionHeading
        eyebrow="Comparison workspace"
        title={`Combining ${datasets.length} datasets`}
        description="Compatibility is assessed pairwise on declared metadata. A low score means the combination needs planning, not that it is impossible — and a high score is not a guarantee that any holder would agree to it."
      />

      {/* Headline constraints ---------------------------------------------- */}
      {constraints ? (
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-parchment-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
              Shared analysable window
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums">
              {coverage?.valid ? `${coverage.start}–${coverage.end}` : "None"}
            </p>
            <p className="mt-1 text-xs text-ink-500">
              {coverage?.valid
                ? `${coverage.end - coverage.start + 1} years held by every dataset`
                : "No year is covered by every dataset"}
            </p>
          </Card>
          <Card className="bg-parchment-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Jurisdictions</p>
            <p className="mt-1 text-xl font-semibold tabular-nums">{constraints.countries.length}</p>
            <p className="mt-1 text-xs text-ink-500">{constraints.countries.join(", ")}</p>
          </Card>
          <Card className="bg-parchment-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
              Governing minimum cell
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums">
              {constraints.aggregationThreshold}
            </p>
            <p className="mt-1 text-xs text-ink-500">The strictest threshold applies to all outputs</p>
          </Card>
          <Card className="bg-parchment-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
              Maximum access period
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums">
              {constraints.maximumAccessMonths}
              <span className="text-sm font-normal text-ink-500"> months</span>
            </p>
            <p className="mt-1 text-xs text-ink-500">
              Longest indicative decision: {constraints.longestDecisionDays} working days
            </p>
          </Card>
        </div>
      ) : null}

      {/* Side-by-side ------------------------------------------------------ */}
      <section aria-labelledby="side-by-side-heading" className="mb-8">
        <SectionHeading id="side-by-side-heading" eyebrow="Attributes" title="Side by side" />
        <div className="table-scroll">
          <table className="w-full min-w-[52rem] border-collapse text-left text-sm">
            <caption className="sr-only">
              Attribute comparison across the {datasets.length} datasets in this project.
            </caption>
            <thead>
              <tr className="border-b-2 border-ink-200">
                <th scope="col" className="w-40 py-2 pr-4 text-xs uppercase tracking-wide text-ink-500">
                  Attribute
                </th>
                {datasets.map((dataset) => (
                  <th key={dataset.id} scope="col" className="py-2 pr-4 align-bottom">
                    <Link href={`/catalogue/${dataset.id}`} className="hover:underline">
                      <span className="block font-semibold text-ink-900">{dataset.acronym}</span>
                    </Link>
                    <span className="block text-xs font-normal text-ink-500">{dataset.country}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(
                [
                  { label: "Coverage", render: (d: Dataset) => coverageLabel(d) },
                  { label: "Updates", render: (d: Dataset) => d.updateFrequency },
                  { label: "Cohort", render: (d: Dataset) => `~${formatCohort(d.approximateCohortSize)}` },
                  { label: "Access body", render: (d: Dataset) => d.accessBody.name },
                  { label: "Access complexity", render: (d: Dataset) => d.accessComplexity },
                  { label: "Linkage", render: (d: Dataset) => d.linkage.status },
                  { label: "Coding systems", render: (d: Dataset) => d.codingSystems.join(", ") },
                  { label: "Populations", render: (d: Dataset) => d.populations.join(", ") },
                  {
                    label: "Minimum cell size",
                    render: (d: Dataset) => String(d.accessConditions.minimumAggregationThreshold),
                  },
                  {
                    label: "Max access period",
                    render: (d: Dataset) => `${d.accessConditions.maximumAccessMonths} months`,
                  },
                  { label: "Fee band", render: (d: Dataset) => d.accessConditions.feeBand },
                  {
                    label: "Secure environment",
                    render: (d: Dataset) =>
                      d.accessConditions.secureProcessingEnvironmentRequired ? "Required" : "Not required",
                  },
                ] as { label: string; render: (dataset: Dataset) => string }[]
              ).map((row) => (
                <tr key={row.label} className="border-b border-ink-100 align-top">
                  <th scope="row" className="py-2.5 pr-4 text-xs font-medium text-ink-600">
                    {row.label}
                  </th>
                  {datasets.map((dataset) => (
                    <td key={dataset.id} className="py-2.5 pr-4 text-ink-800">
                      {row.render(dataset)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Quality comparison ------------------------------------------------ */}
      <section aria-labelledby="quality-heading" className="mb-8">
        <SectionHeading
          id="quality-heading"
          eyebrow="Data quality"
          title="Where harmonisation effort will land"
          description="A wide spread on any indicator means one source will absorb most of the preparation work."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {datasets.map((dataset) => (
            <Card key={dataset.id}>
              <h3 className="mb-3 text-sm font-semibold">
                {dataset.acronym}
                <span className="ml-2 font-normal text-ink-500">{dataset.country}</span>
              </h3>
              <div className="space-y-3">
                <QualityMeter label="Completeness" value={dataset.quality.completeness} />
                <QualityMeter label="Timeliness" value={dataset.quality.timeliness} />
                <QualityMeter label="Interoperability" value={dataset.quality.interoperability} />
                <QualityMeter label="Consistency" value={dataset.quality.consistency} />
                <QualityMeter label="Documentation" value={dataset.quality.documentation} tone="gold" />
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Pairwise ---------------------------------------------------------- */}
      <section aria-labelledby="pairs-heading" className="mb-8">
        <SectionHeading
          id="pairs-heading"
          eyebrow="Pairwise"
          title="How each pair combines"
          description="Compatibility scores are a heuristic invented for this prototype. They combine linkage feasibility, coverage overlap, population overlap and terminology alignment — the full formula is published on the methodology page."
        />
        <ul className="space-y-4">
          {matrix.map((cell) => {
            const a = datasets.find((dataset) => dataset.id === cell.aId)!;
            const b = datasets.find((dataset) => dataset.id === cell.bId)!;
            return (
              <li key={`${cell.aId}-${cell.bId}`}>
                <Card>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <h3 className="text-base font-semibold">
                      {a.acronym} <span className="font-normal text-ink-400">+</span> {b.acronym}
                    </h3>
                    <div className="flex items-center gap-3">
                      <span
                        className={cx(
                          "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          cell.score >= 70
                            ? "bg-emerald-100 text-emerald-900"
                            : cell.score >= 40
                              ? "bg-amber-100 text-amber-900"
                              : "bg-rose-100 text-rose-900",
                        )}
                      >
                        {cell.score >= 70
                          ? "Combines readily"
                          : cell.score >= 40
                            ? "Needs planning"
                            : "Substantial obstacles"}
                      </span>
                      <span className="font-mono text-sm tabular-nums text-ink-600">
                        {cell.score}/100
                      </span>
                    </div>
                  </div>

                  <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                        Record linkage
                      </dt>
                      <dd className="mt-1">
                        <Badge
                          tone={
                            cell.linkage.level === "established"
                              ? "positive"
                              : cell.linkage.level === "possible"
                                ? "caution"
                                : "critical"
                          }
                        >
                          {cell.linkage.level}
                        </Badge>
                        <p className="mt-1.5 text-sm text-ink-700">{cell.linkage.explanation}</p>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                        Shared coverage
                      </dt>
                      <dd className="mt-1 text-sm text-ink-700">
                        {cell.sharedYears.valid
                          ? `${cell.sharedYears.start}–${cell.sharedYears.end} (${
                              cell.sharedYears.end - cell.sharedYears.start + 1
                            } years)`
                          : "No overlapping years"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                        Shared populations
                      </dt>
                      <dd className="mt-1 text-sm text-ink-700">
                        {cell.sharedPopulations.length > 0
                          ? cell.sharedPopulations.join(", ")
                          : "None declared in common"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                        Terminology
                      </dt>
                      <dd className="mt-1 text-sm text-ink-700">
                        {cell.terminology.shared.length > 0
                          ? `Shared: ${cell.terminology.shared.join(", ")}`
                          : "No coding system in common"}
                        {cell.terminology.diagnosisConflict.length > 0 ? (
                          <span className="mt-1 block text-amber-800">
                            Diagnosis classification conflict:{" "}
                            {cell.terminology.diagnosisConflict.join(" vs ")}
                          </span>
                        ) : null}
                      </dd>
                    </div>
                  </dl>
                </Card>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Findings ---------------------------------------------------------- */}
      <section aria-labelledby="compat-findings-heading">
        <SectionHeading
          id="compat-findings-heading"
          eyebrow="Review"
          title={`Compatibility and terminology findings (${findings.length})`}
        />
        {findings.length === 0 ? (
          <p className="surface-muted p-4 text-sm text-ink-600">
            No compatibility or terminology findings for this combination. The rules found nothing to
            raise — confirm feasibility with each holder before relying on it.
          </p>
        ) : (
          <div className="space-y-3">
            {findings.map((finding) => (
              <RecommendationCard key={finding.id} finding={finding} onDismiss={onDismiss} />
            ))}
          </div>
        )}
      </section>

      <div className="mt-8">
        <Callout tone="caution" title="Feasibility is not permission">
          A combination this prototype describes as feasible may still be refused, and one it flags
          as blocked may be possible through a route the fictional catalogue does not record. Only
          the relevant access bodies can tell you what is actually available.{" "}
          <Link href={`/projects/${projectId}/application`}>Continue to the application builder</Link>.
        </Callout>
      </div>
    </div>
  );
}
