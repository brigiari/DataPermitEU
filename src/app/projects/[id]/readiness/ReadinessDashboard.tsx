"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ProjectShell } from "@/components/ProjectShell";
import { RecommendationCard } from "@/components/RecommendationCard";
import { AuditTrail } from "@/components/AuditTrail";
import { ExportDisclaimer } from "@/components/PrototypeDisclaimer";
import { STATUS_DESCRIPTIONS, STATUS_LABELS } from "@/components/StatusBadge";
import {
  Badge,
  Button,
  Card,
  Callout,
  LinkButton,
  SectionHeading,
  cx,
} from "@/components/ui/primitives";
import { buildReadinessReport, dimensionFor } from "@/lib/readiness";
import { buildApplicationExport, buildAuditExport, downloadJson } from "@/lib/export";
import { DOCUMENT_LABELS } from "@/lib/data/documents";
import type { ApplicationStatus, Dataset, Project, Recommendation } from "@/lib/types";
import type { WorkspaceAction } from "@/lib/store/reducer";

export function ReadinessDashboard({ projectId }: { projectId: string }) {
  return (
    <ProjectShell projectId={projectId}>
      {({ project, datasets, findings, dispatch }) => (
        <DashboardBody project={project} datasets={datasets} findings={findings} dispatch={dispatch} />
      )}
    </ProjectShell>
  );
}

function DashboardBody({
  project,
  datasets,
  findings,
  dispatch,
}: {
  project: Project;
  datasets: Dataset[];
  findings: Recommendation[];
  dispatch: (action: WorkspaceAction) => void;
}) {
  const [exported, setExported] = useState<string | null>(null);
  const report = useMemo(
    () => buildReadinessReport(project, datasets, findings),
    [project, datasets, findings],
  );
  const now = () => new Date().toISOString();

  const byDimension = useMemo(() => {
    const map = new Map<string, Recommendation[]>();
    for (const finding of findings) {
      const key = dimensionFor(finding);
      map.set(key, [...(map.get(key) ?? []), finding]);
    }
    return map;
  }, [findings]);

  function exportApplication() {
    const payload = buildApplicationExport(project, datasets, findings, now());
    downloadJson(`datapermit-eu-application-${project.id}.json`, payload);
    setExported("Structured application exported as JSON.");
  }

  function exportAudit() {
    downloadJson(`datapermit-eu-audit-${project.id}.json`, buildAuditExport(project, now()));
    setExported("Audit trail exported as JSON.");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <SectionHeading
        eyebrow="Readiness"
        title="What is still outstanding"
        description="A completeness measure, not a prediction. It reflects how much of the application has been written and how many open findings remain. No access body uses anything like it, and a high score is not an indication that a request would be approved."
      />

      {/* Overall ------------------------------------------------------------ */}
      <Card className="mb-6">
        <div className="grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center">
          <div className="text-center sm:text-left">
            <div className="flex items-baseline gap-2 justify-center sm:justify-start">
              <span className="text-5xl font-semibold tabular-nums text-ink-900">
                {report.overall}
              </span>
              <span className="text-lg text-ink-400">/100</span>
            </div>
            <Badge
              tone={
                report.overall >= 80 ? "positive" : report.overall >= 50 ? "cyan" : "caution"
              }
              className="mt-2"
            >
              {report.band}
            </Badge>
          </div>
          <div>
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="surface-muted px-3 py-2">
                <dt className="text-[0.6875rem] uppercase tracking-wide text-ink-500">
                  Needs attention
                </dt>
                <dd
                  className={cx(
                    "text-xl font-semibold tabular-nums",
                    report.blockingFindings.length > 0 ? "text-amber-800" : "text-emerald-800",
                  )}
                >
                  {report.blockingFindings.length}
                </dd>
              </div>
              <div className="surface-muted px-3 py-2">
                <dt className="text-[0.6875rem] uppercase tracking-wide text-ink-500">
                  Total findings
                </dt>
                <dd className="text-xl font-semibold tabular-nums text-ink-900">{findings.length}</dd>
              </div>
              <div className="surface-muted px-3 py-2">
                <dt className="text-[0.6875rem] uppercase tracking-wide text-ink-500">Documents</dt>
                <dd className="text-xl font-semibold tabular-nums text-ink-900">
                  {report.documentsAttached}/{report.documentsRequired}
                </dd>
              </div>
              <div className="surface-muted px-3 py-2">
                <dt className="text-[0.6875rem] uppercase tracking-wide text-ink-500">Variables</dt>
                <dd className="text-xl font-semibold tabular-nums text-ink-900">
                  {project.application.requestedVariables.length}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </Card>

      {/* Dimensions ---------------------------------------------------------- */}
      <section aria-labelledby="dimensions-heading" className="mb-8">
        <SectionHeading
          id="dimensions-heading"
          eyebrow="Breakdown"
          title="Readiness by section"
          description="Each section scores on how completely it is written, then loses points for open findings — fifteen for each that needs attention, five for each advisory, capped at sixty."
        />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {report.dimensions.map((dimension) => {
            const items = byDimension.get(dimension.id) ?? [];
            return (
              <li key={dimension.id}>
                <Card className="h-full">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold">{dimension.label}</h3>
                    <span className="font-mono text-sm tabular-nums text-ink-600">
                      {dimension.score}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-ink-500">{dimension.description}</p>
                  <div
                    role="meter"
                    aria-valuenow={dimension.score}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${dimension.label} readiness`}
                    className="mt-3 h-2 w-full overflow-hidden rounded-full bg-ink-100"
                  >
                    <div
                      className={cx(
                        "h-full rounded-full",
                        dimension.score >= 80
                          ? "bg-emerald-500"
                          : dimension.score >= 50
                            ? "bg-cyan-500"
                            : "bg-gold-400",
                      )}
                      style={{ width: `${dimension.score}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-ink-600">
                    {dimension.openItems === 0
                      ? "No open findings"
                      : `${dimension.openItems} open finding${dimension.openItems === 1 ? "" : "s"}${
                          dimension.blocking > 0 ? `, ${dimension.blocking} needing attention` : ""
                        }`}
                  </p>
                  {items.length > 0 ? (
                    <ul className="mt-2 space-y-1">
                      {items.slice(0, 3).map((finding) => (
                        <li key={finding.id} className="flex gap-1.5 text-xs text-ink-600">
                          <span
                            aria-hidden="true"
                            className={
                              finding.severity === "attention" ? "text-amber-600" : "text-cyan-600"
                            }
                          >
                            ·
                          </span>
                          <span className="line-clamp-2">{finding.title}</span>
                        </li>
                      ))}
                      {items.length > 3 ? (
                        <li className="text-xs text-ink-400">+ {items.length - 3} more</li>
                      ) : null}
                    </ul>
                  ) : null}
                </Card>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-8">
          {/* Blocking ------------------------------------------------------ */}
          <section aria-labelledby="blocking-heading">
            <SectionHeading
              id="blocking-heading"
              eyebrow="Priority"
              title={`Findings needing attention (${report.blockingFindings.length})`}
              description="These are the ones most likely to cause a submission to be returned in a real process: missing documents, unanswered sections, unresolved incompatibilities and unexplained sensitive requests."
            />
            {report.blockingFindings.length === 0 ? (
              <p className="surface-muted p-4 text-sm text-ink-600">
                Nothing outstanding at this severity. Advisory findings may remain — check the
                sections above.
              </p>
            ) : (
              <div className="space-y-3">
                {report.blockingFindings.map((finding) => (
                  <RecommendationCard
                    key={finding.id}
                    finding={finding}
                    onDismiss={(item) =>
                      dispatch({
                        type: "dismiss-recommendation",
                        projectId: project.id,
                        recommendationId: item.id,
                        title: item.title,
                        now: now(),
                      })
                    }
                  />
                ))}
              </div>
            )}
          </section>

          {/* Missing documents --------------------------------------------- */}
          {report.missingDocuments.length > 0 ? (
            <section aria-labelledby="documents-heading">
              <SectionHeading
                id="documents-heading"
                eyebrow="Documentation"
                title={`${report.missingDocuments.length} required document(s) not yet attached`}
              />
              <Card>
                <ul className="space-y-2">
                  {report.missingDocuments.map((label) => {
                    const documentId = (
                      Object.keys(DOCUMENT_LABELS) as (keyof typeof DOCUMENT_LABELS)[]
                    ).find((key) => DOCUMENT_LABELS[key] === label);
                    const record = project.application.documents.find(
                      (document) => document.id === documentId,
                    );
                    return (
                      <li key={label} className="flex flex-wrap items-center gap-2 text-sm">
                        <span aria-hidden="true" className="text-amber-600">
                          ○
                        </span>
                        <span className="font-medium text-ink-800">{label}</span>
                        <Badge tone={record?.status === "in-preparation" ? "cyan" : "caution"}>
                          {record?.status ?? "not-started"}
                        </Badge>
                        {record?.note ? (
                          <span className="w-full text-xs text-ink-500 sm:w-auto">{record.note}</span>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
                <LinkButton href={`/projects/${project.id}/application`} className="mt-4">
                  Update the documentation checklist
                </LinkButton>
              </Card>
            </section>
          ) : null}

          {/* Audit --------------------------------------------------------- */}
          <section aria-labelledby="audit-heading">
            <SectionHeading
              id="audit-heading"
              eyebrow="Record"
              title="Recent activity"
              description="The full trail is exported alongside the application, so the reasoning behind a request travels with it."
            />
            <AuditTrail entries={project.auditTrail} limit={10} />
          </section>
        </div>

        {/* Sidebar --------------------------------------------------------- */}
        <div className="space-y-6">
          <Card>
            <h2 className="mb-3 text-base font-semibold">Export</h2>
            <ExportDisclaimer />
            <div className="mt-4 space-y-2">
              <Button variant="primary" className="w-full" onClick={exportApplication}>
                Download application (JSON)
              </Button>
              <Button className="w-full" onClick={exportAudit}>
                Download audit trail (JSON)
              </Button>
              <LinkButton href={`/projects/${project.id}/readiness/print`} className="w-full">
                Open print-ready view
              </LinkButton>
            </div>
            {exported ? (
              <p role="status" className="mt-3 text-xs text-emerald-800">
                {exported}
              </p>
            ) : null}
            <p className="mt-3 text-xs text-ink-500">
              Exports include every open finding and the full audit trail, including anything you
              dismissed. An export that hid its own caveats would defeat the point.
            </p>
          </Card>

          <Card>
            <h2 className="mb-3 text-base font-semibold">Mock status</h2>
            <label htmlFor="status-select" className="label">
              Application status
            </label>
            <select
              id="status-select"
              className="input mt-1"
              value={project.status}
              onChange={(event) =>
                dispatch({
                  type: "set-status",
                  projectId: project.id,
                  status: event.target.value as ApplicationStatus,
                  now: now(),
                  reference:
                    event.target.value === "submitted" && !project.mockReference
                      ? `MOCK-${project.id.slice(0, 6).toUpperCase()}-${new Date().getFullYear()}`
                      : undefined,
                })
              }
            >
              {(Object.keys(STATUS_LABELS) as ApplicationStatus[]).map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status]}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-ink-600">{STATUS_DESCRIPTIONS[project.status]}</p>
            <p className="mt-3 border-t border-ink-100 pt-3 text-xs text-ink-500">
              Nothing is transmitted. Setting a status changes a label in this browser and writes an
              entry to the audit trail.
            </p>
          </Card>

          <Callout tone="caution" title="Readiness is not approval">
            A score of 100 would mean the form is complete and no rule fired. It would say nothing
            about scientific merit, legal basis, ethical acceptability or whether any access body
            would grant the request. Only the competent authority can tell you that.
          </Callout>

          <Card>
            <h2 className="mb-2 text-base font-semibold">Still to do</h2>
            <ul className="space-y-1.5 text-sm">
              <li>
                <Link
                  href={`/projects/${project.id}/minimisation`}
                  className="text-cyan-800 hover:underline"
                >
                  Data-minimisation review →
                </Link>
              </li>
              <li>
                <Link href={`/projects/${project.id}/compare`} className="text-cyan-800 hover:underline">
                  Dataset comparison →
                </Link>
              </li>
              <li>
                <Link href="/tracker" className="text-cyan-800 hover:underline">
                  Mock application tracker →
                </Link>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
