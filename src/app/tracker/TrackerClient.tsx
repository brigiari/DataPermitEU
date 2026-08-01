"use client";

import Link from "next/link";
import { useWorkspace } from "@/lib/store/WorkspaceProvider";
import { buildReadinessReport } from "@/lib/readiness";
import { governingConstraints } from "@/lib/recommendations/compatibility";
import { AuditTrail } from "@/components/AuditTrail";
import { STATUS_DESCRIPTIONS, STATUS_LABELS, StatusBadge } from "@/components/StatusBadge";
import {
  Badge,
  Card,
  Callout,
  EmptyState,
  LinkButton,
  SectionHeading,
  cx,
} from "@/components/ui/primitives";
import type { ApplicationStatus } from "@/lib/types";

const PIPELINE: ApplicationStatus[] = [
  "draft",
  "internal-review",
  "submitted",
  "clarification-requested",
  "approved",
];

export function TrackerClient() {
  const { projects, datasetsFor, findingsFor, hydrated } = useWorkspace();

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6" aria-busy="true">
        <div className="h-48 animate-pulse rounded-lg bg-ink-100" />
      </div>
    );
  }

  const byStatus = PIPELINE.map((status) => ({
    status,
    projects: projects.filter((project) => project.status === status),
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <SectionHeading
        eyebrow="Tracker"
        title="Mock application tracker"
        description="Where each application sits, which fictional access bodies would be involved, and what is still outstanding. Statuses are set by hand — no application is ever transmitted, and no decision here reflects any real process."
      />

      <Callout tone="caution" title="Simulated end to end">
        Approvals, references and turnaround times shown here are invented. In a real workflow the
        status would come from each Health Data Access Body, not from a control the applicant sets
        themselves.
      </Callout>

      {/* Pipeline ---------------------------------------------------------- */}
      <section aria-labelledby="pipeline-heading" className="mt-8">
        <SectionHeading id="pipeline-heading" eyebrow="Overview" title="Pipeline" />
        <ol className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {byStatus.map((column) => (
            <li key={column.status}>
              <div
                className={cx(
                  "surface-muted h-full p-4",
                  column.projects.length > 0 && "border-cyan-300 bg-cyan-50/40",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-600">
                    {STATUS_LABELS[column.status]}
                  </h3>
                  <span className="font-mono text-sm tabular-nums text-ink-700">
                    {column.projects.length}
                  </span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-ink-500">
                  {STATUS_DESCRIPTIONS[column.status]}
                </p>
                {column.projects.length > 0 ? (
                  <ul className="mt-3 space-y-1.5">
                    {column.projects.map((project) => (
                      <li key={project.id}>
                        <Link
                          href={`/projects/${project.id}`}
                          className="text-xs font-medium text-cyan-800 hover:underline"
                        >
                          {project.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Detail ------------------------------------------------------------ */}
      <section aria-labelledby="applications-heading" className="mt-10">
        <SectionHeading id="applications-heading" eyebrow="Detail" title="Applications" />
        {projects.length === 0 ? (
          <EmptyState
            title="No applications yet"
            description="Create a project and build an application to see it tracked here."
            action={<LinkButton href="/projects" variant="primary">Go to projects</LinkButton>}
          />
        ) : (
          <ul className="space-y-6">
            {projects.map((project) => {
              const datasets = datasetsFor(project.id);
              const findings = findingsFor(project.id);
              const report = buildReadinessReport(project, datasets, findings);
              const constraints = datasets.length > 0 ? governingConstraints(datasets) : null;

              return (
                <li key={project.id}>
                  <Card>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="mb-1.5 flex flex-wrap items-center gap-2">
                          <StatusBadge status={project.status} />
                          {project.mockReference ? (
                            <span className="font-mono text-xs text-ink-500">
                              {project.mockReference}
                            </span>
                          ) : null}
                          {project.submittedAt ? (
                            <span className="text-xs text-ink-500">
                              Marked submitted{" "}
                              {new Date(project.submittedAt).toLocaleDateString("en-GB")}
                            </span>
                          ) : null}
                        </div>
                        <h3 className="text-lg font-semibold">
                          <Link href={`/projects/${project.id}`} className="hover:underline">
                            {project.title}
                          </Link>
                        </h3>
                        <p className="prose-body mt-1 max-w-3xl text-sm">{project.researchQuestion}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-semibold tabular-nums">{report.overall}/100</p>
                        <p className="text-xs text-ink-500">{report.band}</p>
                      </div>
                    </div>

                    {constraints ? (
                      <div className="mt-4 rounded border border-ink-200 bg-parchment-50 p-4">
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                          Access bodies that would need to decide
                        </h4>
                        <ul className="mt-2 space-y-2">
                          {datasets.map((dataset) => (
                            <li
                              key={dataset.id}
                              className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm"
                            >
                              <Badge tone="neutral">{dataset.acronym}</Badge>
                              <span className="text-ink-800">{dataset.accessBody.name}</span>
                              <span className="text-xs text-ink-500">
                                indicative {dataset.accessBody.indicativeDecisionDays} working days
                              </span>
                            </li>
                          ))}
                        </ul>
                        <p className="mt-2.5 text-xs text-ink-600">
                          Applications to {constraints.jurisdictions.length} bodies across{" "}
                          {constraints.countries.length} jurisdiction(s). Assuming they run in
                          parallel, the slowest indicative decision is{" "}
                          {constraints.longestDecisionDays} working days — all figures fictional.
                        </p>
                      </div>
                    ) : null}

                    <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {[
                        { term: "Datasets", value: String(datasets.length) },
                        {
                          term: "Documents",
                          value: `${report.documentsAttached}/${report.documentsRequired}`,
                        },
                        {
                          term: "Needs attention",
                          value: String(report.blockingFindings.length),
                        },
                        { term: "Audit entries", value: String(project.auditTrail.length) },
                      ].map((item) => (
                        <div key={item.term} className="surface-muted px-3 py-2">
                          <dt className="text-[0.6875rem] uppercase tracking-wide text-ink-500">
                            {item.term}
                          </dt>
                          <dd className="text-lg font-semibold tabular-nums">{item.value}</dd>
                        </div>
                      ))}
                    </dl>

                    {report.missingDocuments.length > 0 ? (
                      <p className="mt-3 text-sm text-amber-800">
                        Outstanding documentation: {report.missingDocuments.join(", ")}.
                      </p>
                    ) : null}

                    <details className="mt-4">
                      <summary className="cursor-pointer text-sm font-medium text-ink-600 hover:text-ink-900">
                        Recent activity ({project.auditTrail.length} entries)
                      </summary>
                      <div className="mt-3">
                        <AuditTrail entries={project.auditTrail} limit={6} />
                      </div>
                    </details>

                    <div className="mt-4 flex flex-wrap gap-3 border-t border-ink-100 pt-4">
                      <Link
                        href={`/projects/${project.id}/readiness`}
                        className="text-sm font-medium text-cyan-800 hover:underline"
                      >
                        Readiness dashboard →
                      </Link>
                      <Link
                        href={`/projects/${project.id}/readiness/print`}
                        className="text-sm font-medium text-cyan-800 hover:underline"
                      >
                        Print-ready application →
                      </Link>
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
