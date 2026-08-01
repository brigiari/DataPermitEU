import Link from "next/link";
import type { Dataset } from "@/lib/types";
import type { RelevanceScore } from "@/lib/recommendations/relevance";
import { Badge, cx } from "@/components/ui/primitives";

export function formatCohort(size: number): string {
  if (size >= 1_000_000) return `${(size / 1_000_000).toFixed(size >= 10_000_000 ? 0 : 1)}M`;
  if (size >= 1_000) return `${Math.round(size / 1_000)}k`;
  return String(size);
}

export function coverageLabel(dataset: Dataset): string {
  return `${dataset.timeCoverage.start}–${
    dataset.timeCoverage.end === "ongoing" ? "present" : dataset.timeCoverage.end
  }`;
}

const COMPLEXITY_TONE = {
  Streamlined: "positive",
  Standard: "cyan",
  Complex: "caution",
} as const;

/** Compact quality strip — four indicators as small stacked bars. */
function QualityStrip({ dataset }: { dataset: Dataset }) {
  const items = [
    { label: "Completeness", value: dataset.quality.completeness },
    { label: "Timeliness", value: dataset.quality.timeliness },
    { label: "Interoperability", value: dataset.quality.interoperability },
    { label: "Documentation", value: dataset.quality.documentation },
  ];
  return (
    <div className="flex items-end gap-1.5" aria-hidden="true">
      {items.map((item) => (
        <span key={item.label} className="flex h-8 w-2 items-end rounded-sm bg-ink-100" title={`${item.label}: ${item.value}/100`}>
          <span
            className={cx(
              "w-full rounded-sm",
              item.value >= 85 ? "bg-cyan-600" : item.value >= 65 ? "bg-cyan-400" : "bg-gold-400",
            )}
            style={{ height: `${Math.max(8, item.value)}%` }}
          />
        </span>
      ))}
    </div>
  );
}

export function DatasetCard({
  dataset,
  relevance,
  action,
  inProject = false,
}: {
  dataset: Dataset;
  relevance?: RelevanceScore;
  action?: React.ReactNode;
  inProject?: boolean;
}) {
  return (
    <article className="surface flex h-full flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <Badge tone="cyan">{dataset.country}</Badge>
            <Badge tone={COMPLEXITY_TONE[dataset.accessComplexity]}>
              {dataset.accessComplexity} access
            </Badge>
            {inProject ? <Badge tone="gold">In project</Badge> : null}
          </div>
          <h3 className="text-base font-semibold leading-snug">
            <Link href={`/catalogue/${dataset.id}`} className="hover:text-cyan-800 hover:underline">
              {dataset.name}
            </Link>
          </h3>
          <p className="mt-0.5 font-mono text-xs text-ink-500">
            {dataset.acronym} · {dataset.catalogueRef}
          </p>
        </div>
        <QualityStrip dataset={dataset} />
      </div>

      <p className="prose-body mt-3 line-clamp-3">{dataset.summary}</p>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-4">
        {[
          { term: "Coverage", value: coverageLabel(dataset) },
          { term: "Updates", value: dataset.updateFrequency },
          { term: "Cohort", value: `~${formatCohort(dataset.approximateCohortSize)}` },
          { term: "Variables", value: String(dataset.variables.length) },
        ].map((item) => (
          <div key={item.term}>
            <dt className="text-ink-500">{item.term}</dt>
            <dd className="font-medium text-ink-800">{item.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {dataset.diseaseAreas.slice(0, 3).map((area) => (
          <Badge key={area}>{area}</Badge>
        ))}
        {dataset.dataCategories.slice(0, 2).map((category) => (
          <Badge key={category} tone="neutral">
            {category}
          </Badge>
        ))}
      </div>

      {relevance && relevance.score > 0 ? (
        <div className="mt-4 rounded border border-cyan-200 bg-cyan-50/60 p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-cyan-900">
              {relevance.band}
            </span>
            <span className="font-mono text-xs tabular-nums text-cyan-900">{relevance.score}/100</span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-ink-700">{relevance.headline}</p>
        </div>
      ) : null}

      <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
        <Link
          href={`/catalogue/${dataset.id}`}
          className="text-sm font-medium text-cyan-800 hover:underline"
        >
          View full profile <span aria-hidden="true">→</span>
        </Link>
        {action ? <div className="ml-auto">{action}</div> : null}
      </div>
    </article>
  );
}
