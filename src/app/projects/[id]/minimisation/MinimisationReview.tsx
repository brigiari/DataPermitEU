"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ProjectShell } from "@/components/ProjectShell";
import { RecommendationCard } from "@/components/RecommendationCard";
import {
  Badge,
  Button,
  Card,
  Callout,
  EmptyState,
  LinkButton,
  SectionHeading,
  StatTile,
  cx,
} from "@/components/ui/primitives";
import { minimisationSummary } from "@/lib/recommendations/minimisation";
import { getVariable } from "@/lib/data/datasets";
import { wordCount } from "@/lib/text";
import type { Dataset, Project, Recommendation } from "@/lib/types";
import type { WorkspaceAction } from "@/lib/store/reducer";

const SENSITIVITY_TONE = {
  low: "neutral",
  moderate: "cyan",
  high: "caution",
  "direct-identifier": "critical",
} as const;

export function MinimisationReview({ projectId }: { projectId: string }) {
  return (
    <ProjectShell projectId={projectId}>
      {({ project, datasets, findings, dispatch }) => (
        <ReviewBody project={project} datasets={datasets} findings={findings} dispatch={dispatch} />
      )}
    </ProjectShell>
  );
}

function ReviewBody({
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
  const application = project.application;
  const minimisationFindings = findings.filter((finding) => finding.kind === "data-minimisation");

  const summary = useMemo(
    () => minimisationSummary({ application, datasets }),
    [application, datasets],
  );

  const flaggedVariableIds = useMemo(() => {
    const ids = new Set<string>();
    for (const finding of minimisationFindings) {
      for (const variableId of finding.scope.variableIds ?? []) ids.add(variableId);
    }
    return ids;
  }, [minimisationFindings]);

  const now = () => new Date().toISOString();

  if (application.requestedVariables.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <EmptyState
          title="No variables requested yet"
          description="The minimisation assistant reviews each requested variable against the stated research purpose. Select variables in the application builder first."
          action={
            <LinkButton href={`/projects/${project.id}/application`} variant="primary">
              Open the application builder
            </LinkButton>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <SectionHeading
        eyebrow="Data minimisation"
        title="Is every variable in this request necessary?"
        description="Data minimisation is a per-field question, so this review works per field. It compares each requested variable's category and sensitivity against the research purpose, the analysis plan and the justification you recorded. Nothing here is removed automatically — every finding is a prompt for you to decide."
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Variables requested"
          value={summary.totalRequested}
          detail={`${Math.round((summary.totalRequested / Math.max(1, summary.totalAvailable)) * 100)}% of what is available`}
        />
        <StatTile
          label="With a substantive justification"
          value={`${summary.withJustification}/${summary.totalRequested}`}
          tone={summary.withJustification === summary.totalRequested ? "positive" : "attention"}
          detail="Six or more words, not a restatement of the name"
        />
        <StatTile
          label="High sensitivity or identifier"
          value={summary.bySensitivity.high + summary.bySensitivity["direct-identifier"]}
          tone={summary.bySensitivity["direct-identifier"] > 0 ? "attention" : "neutral"}
          detail={`${summary.bySensitivity["direct-identifier"]} direct identifier(s)`}
        />
        <StatTile
          label="Requested at reduced detail"
          value={summary.coarsened}
          tone={summary.coarsened > 0 ? "positive" : "neutral"}
          detail="Coarsened or derived rather than full granularity"
        />
      </div>

      {/* Sensitivity distribution ------------------------------------------ */}
      <Card className="mb-6">
        <h2 className="mb-3 text-base font-semibold">Sensitivity profile of the request</h2>
        <div className="flex h-6 w-full overflow-hidden rounded-md" role="img" aria-label={
          `Sensitivity distribution: ${summary.bySensitivity.low} low, ${summary.bySensitivity.moderate} moderate, ${summary.bySensitivity.high} high, ${summary.bySensitivity["direct-identifier"]} direct identifier`
        }>
          {(
            [
              { key: "low", colour: "bg-ink-300", count: summary.bySensitivity.low },
              { key: "moderate", colour: "bg-cyan-400", count: summary.bySensitivity.moderate },
              { key: "high", colour: "bg-amber-400", count: summary.bySensitivity.high },
              {
                key: "direct-identifier",
                colour: "bg-rose-500",
                count: summary.bySensitivity["direct-identifier"],
              },
            ] as const
          ).map((band) =>
            band.count > 0 ? (
              <span
                key={band.key}
                className={cx(band.colour, "flex items-center justify-center")}
                style={{ width: `${(band.count / Math.max(1, summary.totalRequested)) * 100}%` }}
              >
                <span className="px-1 text-xs font-semibold text-white/90">{band.count}</span>
              </span>
            ) : null,
          )}
        </div>
        <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-ink-600">
          {(
            [
              { label: "Low", colour: "bg-ink-300", count: summary.bySensitivity.low },
              { label: "Moderate", colour: "bg-cyan-400", count: summary.bySensitivity.moderate },
              { label: "High", colour: "bg-amber-400", count: summary.bySensitivity.high },
              {
                label: "Direct identifier",
                colour: "bg-rose-500",
                count: summary.bySensitivity["direct-identifier"],
              },
            ] as const
          ).map((band) => (
            <li key={band.label} className="flex items-center gap-1.5">
              <span aria-hidden="true" className={cx("h-2.5 w-2.5 rounded-sm", band.colour)} />
              {band.label}: <span className="font-medium text-ink-800">{band.count}</span>
            </li>
          ))}
        </ul>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-8">
          {/* Findings ------------------------------------------------------ */}
          <section aria-labelledby="min-findings-heading">
            <SectionHeading
              id="min-findings-heading"
              eyebrow="Review"
              title={`Minimisation findings (${minimisationFindings.length})`}
              description="Ordered by severity. The rules cannot know your confounding structure, so a flagged variable is a request for an explanation, not an instruction to remove it — and MIN-04 in particular is expected to produce false positives."
            />
            {minimisationFindings.length === 0 ? (
              <p className="surface-muted p-4 text-sm text-ink-600">
                No minimisation findings. Every requested variable is either low sensitivity or
                carries a substantive justification, and none sits outside the terms used in your
                purpose and analysis plan.
              </p>
            ) : (
              <div className="space-y-3">
                {minimisationFindings.map((finding) => (
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

          {/* Full request table -------------------------------------------- */}
          <section aria-labelledby="request-table-heading">
            <SectionHeading
              id="request-table-heading"
              eyebrow="The request"
              title="Every variable you have asked for"
              description="Rows with an open finding are marked. Edit justifications in the application builder."
            />
            <div className="table-scroll">
              <table className="w-full min-w-[48rem] border-collapse text-left text-sm">
                <caption className="sr-only">
                  All {application.requestedVariables.length} requested variables with dataset,
                  sensitivity, granularity and justification.
                </caption>
                <thead>
                  <tr className="border-b-2 border-ink-200 text-xs uppercase tracking-wide text-ink-500">
                    <th scope="col" className="py-2 pr-4 font-semibold">
                      Variable
                    </th>
                    <th scope="col" className="py-2 pr-4 font-semibold">
                      Dataset
                    </th>
                    <th scope="col" className="py-2 pr-4 font-semibold">
                      Sensitivity
                    </th>
                    <th scope="col" className="py-2 pr-4 font-semibold">
                      Granularity
                    </th>
                    <th scope="col" className="py-2 font-semibold">
                      Justification
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {application.requestedVariables.map((requested) => {
                    const dataset = datasets.find(
                      (candidate) => candidate.id === requested.datasetId,
                    );
                    const variable = getVariable(requested.datasetId, requested.variableId);
                    if (!dataset || !variable) return null;
                    const flagged = flaggedVariableIds.has(variable.id);
                    const words = wordCount(requested.justification);
                    return (
                      <tr
                        key={`${requested.datasetId}-${requested.variableId}`}
                        className={cx(
                          "border-b border-ink-100 align-top",
                          flagged && "bg-amber-50/50",
                        )}
                      >
                        <th scope="row" className="py-3 pr-4 font-normal">
                          <span className="block font-medium text-ink-900">{variable.name}</span>
                          <span className="text-xs capitalize text-ink-500">{variable.category}</span>
                          {flagged ? (
                            <Badge tone="caution" className="mt-1">
                              Finding raised
                            </Badge>
                          ) : null}
                        </th>
                        <td className="py-3 pr-4">
                          <Link
                            href={`/catalogue/${dataset.id}`}
                            className="text-cyan-800 hover:underline"
                          >
                            {dataset.acronym}
                          </Link>
                        </td>
                        <td className="py-3 pr-4">
                          <Badge tone={SENSITIVITY_TONE[variable.sensitivity]}>
                            {variable.sensitivity}
                          </Badge>
                        </td>
                        <td className="py-3 pr-4 text-xs text-ink-600">{requested.granularity}</td>
                        <td className="max-w-md py-3 text-xs leading-relaxed text-ink-700">
                          {requested.justification || (
                            <span className="italic text-amber-700">No justification recorded</span>
                          )}
                          {words > 0 ? (
                            <span className="mt-0.5 block text-ink-400">{words} words</span>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-4">
              <LinkButton href={`/projects/${project.id}/application`}>
                Edit variables and justifications
              </LinkButton>
            </div>
          </section>
        </div>

        {/* Sidebar --------------------------------------------------------- */}
        <div className="space-y-6">
          <Card>
            <h2 className="mb-3 text-base font-semibold">How this review works</h2>
            <ul className="space-y-3 text-sm text-ink-700">
              {[
                {
                  id: "MIN-01",
                  text: "Flags variables the catalogue classifies as direct identifiers.",
                },
                {
                  id: "MIN-02",
                  text: "Flags variables where the holder publishes a coarser default and you asked for full detail.",
                },
                {
                  id: "MIN-03",
                  text: "Flags high-sensitivity variables whose justification is missing or too thin to assess.",
                },
                {
                  id: "MIN-04",
                  text: "Flags variables whose analytical category appears nowhere in your purpose or analysis plan.",
                },
                {
                  id: "MIN-05",
                  text: "Flags datasets where you have requested most of the available variables.",
                },
                { id: "MIN-06", text: "Flags unstructured free-text fields." },
                {
                  id: "MIN-07",
                  text: "Flags the same analytical concept requested from more than one dataset.",
                },
              ].map((rule) => (
                <li key={rule.id} className="flex gap-2.5">
                  <span className="shrink-0 font-mono text-xs font-semibold text-cyan-800">
                    {rule.id}
                  </span>
                  <span className="text-xs leading-relaxed">{rule.text}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/methodology#minimisation"
              className="mt-4 block text-sm font-medium text-cyan-800 hover:underline"
            >
              Full rule definitions and weaknesses →
            </Link>
          </Card>

          <Callout tone="trust" title="What minimisation is for">
            Asking for less data is not administrative friction. It reduces the number of people
            whose records are exposed, narrows what a breach could reveal, and makes the request
            easier to approve. A well-argued narrow request usually beats a broad one.
          </Callout>

          <Callout tone="caution" title="Not a compliance check">
            This review does not determine whether a request complies with any law or holder policy.
            It highlights wording a reviewer would likely query. Confirm the position with your data
            protection officer and the relevant access body.
          </Callout>

          {minimisationFindings.length > 0 ? (
            <Card>
              <h2 className="mb-2 text-base font-semibold">Disagree with a finding?</h2>
              <p className="text-sm text-ink-600">
                Dismiss it. The dismissal is written to the audit trail with a timestamp rather than
                quietly dropped, so the record shows what was considered and set aside.
              </p>
              <Button
                variant="ghost"
                className="mt-3"
                onClick={() => {
                  window.location.hash = "min-findings-heading";
                }}
              >
                Go to findings
              </Button>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
