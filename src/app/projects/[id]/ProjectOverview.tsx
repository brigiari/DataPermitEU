"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ProjectShell } from "@/components/ProjectShell";
import { DatasetCard } from "@/components/DatasetCard";
import { RecommendationCard } from "@/components/RecommendationCard";
import { AuditTrail } from "@/components/AuditTrail";
import { ReviewerPanel } from "@/components/ReviewerPanel";
import {
  Badge,
  Button,
  Card,
  Callout,
  EmptyState,
  LinkButton,
  SectionHeading,
  StatTile,
} from "@/components/ui/primitives";
import { DATASETS } from "@/lib/data/datasets";
import { rankDatasets } from "@/lib/recommendations/relevance";
import { groupByKind } from "@/lib/recommendations";
import { buildReadinessReport } from "@/lib/readiness";
import { governingConstraints, intersectCoverage } from "@/lib/recommendations/compatibility";

export function ProjectOverview({ projectId }: { projectId: string }) {
  return (
    <ProjectShell projectId={projectId}>
      {({ project, datasets, findings, dispatch, role }) => (
        <OverviewBody
          project={project}
          datasets={datasets}
          findings={findings}
          dispatch={dispatch}
          role={role}
        />
      )}
    </ProjectShell>
  );
}

function OverviewBody({
  project,
  datasets,
  findings,
  dispatch,
  role,
}: Parameters<Parameters<typeof ProjectShell>[0]["children"]>[0]) {
  const [editing, setEditing] = useState(false);
  const now = () => new Date().toISOString();

  const readiness = useMemo(
    () => buildReadinessReport(project, datasets, findings),
    [project, datasets, findings],
  );
  const grouped = useMemo(() => groupByKind(findings), [findings]);

  const suggestions = useMemo(() => {
    if (project.researchQuestion.trim().length < 15) return [];
    return rankDatasets(DATASETS, project.researchQuestion)
      .filter((score) => !project.datasetIds.includes(score.datasetId) && score.score >= 30)
      .slice(0, 3);
  }, [project.researchQuestion, project.datasetIds]);

  const constraints = datasets.length > 0 ? governingConstraints(datasets) : null;
  const coverage = datasets.length > 0 ? intersectCoverage(datasets) : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Research question ------------------------------------------------ */}
      <Card className="mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="eyebrow mb-1.5">Research question</p>
            {editing ? (
              <ProjectMetaForm
                project={project}
                onSave={(patch) => {
                  dispatch({ type: "update-project-meta", projectId: project.id, patch, now: now() });
                  setEditing(false);
                }}
                onCancel={() => setEditing(false)}
              />
            ) : (
              <>
                <p className="text-lg leading-relaxed text-ink-800">{project.researchQuestion}</p>
                <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-sm">
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-ink-500">
                      Principal investigator
                    </dt>
                    <dd className="text-ink-800">{project.principalInvestigator || "Not recorded"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-ink-500">Institution</dt>
                    <dd className="text-ink-800">{project.institution || "Not recorded"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-ink-500">Last updated</dt>
                    <dd className="text-ink-800">
                      {new Date(project.updatedAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </dd>
                  </div>
                </dl>
              </>
            )}
          </div>
          {!editing ? <Button onClick={() => setEditing(true)}>Edit details</Button> : null}
        </div>
      </Card>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Datasets in project" value={datasets.length} detail={constraints ? `${constraints.countries.length} jurisdiction(s)` : "None selected"} />
        <StatTile
          label="Variables requested"
          value={project.application.requestedVariables.length}
          detail={`of ${datasets.reduce((total, dataset) => total + dataset.variables.length, 0)} available`}
        />
        <StatTile
          label="Open findings"
          value={findings.length}
          detail={`${findings.filter((finding) => finding.severity === "attention").length} need attention`}
          tone={findings.some((finding) => finding.severity === "attention") ? "attention" : "neutral"}
        />
        <StatTile
          label="Readiness"
          value={`${readiness.overall}/100`}
          detail={readiness.band}
          tone={readiness.overall >= 80 ? "positive" : "neutral"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-8">
          {/* Datasets ---------------------------------------------------- */}
          <section aria-labelledby="datasets-heading">
            <SectionHeading
              id="datasets-heading"
              eyebrow="Selection"
              title="Datasets in this project"
              description={
                coverage?.valid
                  ? `These datasets share coverage from ${coverage.start} to ${coverage.end}.`
                  : datasets.length > 1
                    ? "These datasets share no common years — see the comparison workspace."
                    : undefined
              }
              actions={<LinkButton href="/catalogue">Add from catalogue</LinkButton>}
            />
            {datasets.length === 0 ? (
              <EmptyState
                title="No datasets selected yet"
                description="Search the catalogue to find datasets that fit this research question. Relevance scoring uses the question above."
                action={<LinkButton href="/catalogue" variant="primary">Search the catalogue</LinkButton>}
              />
            ) : (
              <ul className="grid gap-4 md:grid-cols-2">
                {datasets.map((dataset) => (
                  <li key={dataset.id}>
                    <DatasetCard
                      dataset={dataset}
                      inProject
                      action={
                        <Button
                          variant="ghost"
                          onClick={() =>
                            dispatch({
                              type: "remove-dataset",
                              projectId: project.id,
                              datasetId: dataset.id,
                              datasetLabel: `${dataset.acronym} — ${dataset.name}`,
                              now: now(),
                            })
                          }
                        >
                          Remove
                        </Button>
                      }
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Suggestions -------------------------------------------------- */}
          {suggestions.length > 0 ? (
            <section aria-labelledby="suggestions-heading">
              <SectionHeading
                id="suggestions-heading"
                eyebrow="Deterministic rule set"
                title="Datasets you might also consider"
                description="Scored by keyword and concept matching against the research question above. These are prompts to look, not endorsements — open each profile and judge it yourself."
              />
              <ul className="space-y-3">
                {suggestions.map((suggestion) => {
                  const dataset = DATASETS.find((candidate) => candidate.id === suggestion.datasetId)!;
                  return (
                    <li key={suggestion.datasetId}>
                      <Card>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex items-center gap-2">
                              <Badge tone="cyan">{suggestion.band}</Badge>
                              <span className="font-mono text-xs text-ink-500">
                                {suggestion.score}/100
                              </span>
                              <Badge>{dataset.country}</Badge>
                            </div>
                            <h3 className="text-sm font-semibold">
                              <Link href={`/catalogue/${dataset.id}`} className="hover:underline">
                                {dataset.name}
                              </Link>
                            </h3>
                            <p className="prose-body mt-1 text-sm">{suggestion.headline}</p>
                            <details className="mt-2">
                              <summary className="cursor-pointer text-xs font-medium text-ink-600 hover:text-ink-900">
                                How this score was calculated
                              </summary>
                              <ul className="mt-2 space-y-1.5 border-l-2 border-ink-200 pl-3">
                                {suggestion.components.map((component, index) => (
                                  <li key={index} className="text-xs text-ink-600">
                                    <span className="font-medium text-ink-800">
                                      {component.label}: {component.points}/{component.maxPoints}
                                    </span>{" "}
                                    <span className="font-mono text-[0.625rem] text-ink-400">
                                      {component.ruleId}
                                    </span>
                                    <br />
                                    {component.evidence[0]}
                                  </li>
                                ))}
                              </ul>
                            </details>
                          </div>
                          <Button
                            onClick={() =>
                              dispatch({
                                type: "add-dataset",
                                projectId: project.id,
                                datasetId: dataset.id,
                                datasetLabel: `${dataset.acronym} — ${dataset.name}`,
                                now: now(),
                              })
                            }
                          >
                            Add to project
                          </Button>
                        </div>
                      </Card>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}

          {/* Findings ---------------------------------------------------- */}
          <section aria-labelledby="findings-heading">
            <SectionHeading
              id="findings-heading"
              eyebrow="Review"
              title="Open findings"
              description="Everything the rule set has raised across this project. Each one is advisory, explains itself, and can be dismissed — dismissals are recorded in the audit trail rather than hidden."
            />
            {findings.length === 0 ? (
              <p className="surface-muted p-4 text-sm text-ink-600">
                No open findings. That means the rules found nothing to raise — not that the
                application is complete or correct.
              </p>
            ) : (
              <div className="space-y-6">
                {(Object.entries(grouped) as [keyof typeof grouped, typeof findings][])
                  .filter(([, items]) => items.length > 0)
                  .map(([kind, items]) => (
                    <div key={kind}>
                      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-600">
                        {kind.replace(/-/g, " ")} ({items.length})
                      </h3>
                      <div className="space-y-3">
                        {items.map((finding) => (
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
                    </div>
                  ))}
              </div>
            )}

            {project.dismissedRecommendations.length > 0 ? (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-medium text-ink-600 hover:text-ink-900">
                  {project.dismissedRecommendations.length} dismissed finding(s)
                </summary>
                <ul className="mt-2 space-y-1.5">
                  {project.dismissedRecommendations.map((id) => (
                    <li key={id} className="flex items-center gap-3 text-sm text-ink-600">
                      <span className="font-mono text-xs">{id}</span>
                      <Button
                        variant="ghost"
                        onClick={() =>
                          dispatch({
                            type: "restore-recommendation",
                            projectId: project.id,
                            recommendationId: id,
                            now: now(),
                          })
                        }
                      >
                        Restore
                      </Button>
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}
          </section>
        </div>

        {/* Sidebar ------------------------------------------------------- */}
        <div className="space-y-6">
          <Card>
            <h2 className="mb-3 text-base font-semibold">Next steps</h2>
            <ol className="space-y-2.5 text-sm">
              {[
                { href: `/catalogue`, label: "Search the catalogue", done: datasets.length > 0 },
                {
                  href: `/projects/${project.id}/compare`,
                  label: "Compare selected datasets",
                  done: datasets.length > 1,
                },
                {
                  href: `/projects/${project.id}/application`,
                  label: "Complete the application",
                  done: readiness.overall >= 60,
                },
                {
                  href: `/projects/${project.id}/minimisation`,
                  label: "Run the minimisation review",
                  done: grouped["data-minimisation"].length === 0 && project.application.requestedVariables.length > 0,
                },
                {
                  href: `/projects/${project.id}/readiness`,
                  label: "Check readiness and export",
                  done: readiness.blockingFindings.length === 0 && readiness.overall >= 80,
                },
              ].map((step) => (
                <li key={step.href} className="flex items-start gap-2.5">
                  <span
                    aria-hidden="true"
                    className={
                      step.done
                        ? "mt-0.5 text-emerald-600"
                        : "mt-0.5 text-ink-300"
                    }
                  >
                    {step.done ? "✓" : "○"}
                  </span>
                  <Link href={step.href} className="text-ink-700 hover:text-cyan-800 hover:underline">
                    {step.label}
                    <span className="sr-only">{step.done ? " (complete)" : " (outstanding)"}</span>
                  </Link>
                </li>
              ))}
            </ol>
          </Card>

          {constraints ? (
            <Card>
              <h2 className="mb-3 text-base font-semibold">Governing conditions</h2>
              <p className="mb-3 text-xs text-ink-500">
                Where several holders are involved, assume the strictest condition applies.
              </p>
              <dl className="space-y-2.5 text-sm">
                {[
                  { term: "Jurisdictions", value: constraints.countries.join(", ") },
                  { term: "Minimum cell size", value: String(constraints.aggregationThreshold) },
                  { term: "Maximum access", value: `${constraints.maximumAccessMonths} months` },
                  {
                    term: "Longest indicative decision",
                    value: `${constraints.longestDecisionDays} working days`,
                  },
                  {
                    term: "Secure environment",
                    value: constraints.secureEnvironmentRequired ? "Required" : "Not required",
                  },
                ].map((item) => (
                  <div key={item.term} className="flex justify-between gap-3">
                    <dt className="text-ink-500">{item.term}</dt>
                    <dd className="text-right font-medium text-ink-800">{item.value}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          ) : null}

          <ReviewerPanel project={project} role={role} dispatch={dispatch} />

          <Callout tone="caution" title="Not legal advice">
            Findings on this page are educational prompts produced by fixed rules. They contain no
            legal conclusions. Confirm anything that matters with your legal advisers, your ethics
            committee, and the relevant data-access authority.
          </Callout>
        </div>
      </div>

      <section className="mt-10" aria-labelledby="audit-heading">
        <SectionHeading
          id="audit-heading"
          eyebrow="Transparency"
          title="Audit trail"
          description="Every change to this project, appended in order. Dismissed recommendations appear here too, so a reviewer can see what was set aside and when."
        />
        <AuditTrail entries={project.auditTrail} />
      </section>
    </div>
  );
}

function ProjectMetaForm({
  project,
  onSave,
  onCancel,
}: {
  project: Parameters<Parameters<typeof ProjectShell>[0]["children"]>[0]["project"];
  onSave: (patch: {
    title: string;
    researchQuestion: string;
    principalInvestigator: string;
    institution: string;
  }) => void;
  onCancel: () => void;
}) {
  const [values, setValues] = useState({
    title: project.title,
    researchQuestion: project.researchQuestion,
    principalInvestigator: project.principalInvestigator,
    institution: project.institution,
  });

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        onSave(values);
      }}
    >
      <div>
        <label htmlFor="edit-title" className="label">
          Project title
        </label>
        <input
          id="edit-title"
          className="input mt-1"
          value={values.title}
          onChange={(event) => setValues((current) => ({ ...current, title: event.target.value }))}
        />
      </div>
      <div>
        <label htmlFor="edit-question" className="label">
          Research question
        </label>
        <textarea
          id="edit-question"
          className="input mt-1 min-h-[6rem]"
          value={values.researchQuestion}
          onChange={(event) =>
            setValues((current) => ({ ...current, researchQuestion: event.target.value }))
          }
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="edit-pi" className="label">
            Principal investigator
          </label>
          <input
            id="edit-pi"
            className="input mt-1"
            value={values.principalInvestigator}
            onChange={(event) =>
              setValues((current) => ({ ...current, principalInvestigator: event.target.value }))
            }
          />
        </div>
        <div>
          <label htmlFor="edit-institution" className="label">
            Institution
          </label>
          <input
            id="edit-institution"
            className="input mt-1"
            value={values.institution}
            onChange={(event) =>
              setValues((current) => ({ ...current, institution: event.target.value }))
            }
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" variant="primary">
          Save
        </Button>
        <Button type="button" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
