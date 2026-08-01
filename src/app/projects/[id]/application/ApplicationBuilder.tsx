"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ProjectShell } from "@/components/ProjectShell";
import { RecommendationCard } from "@/components/RecommendationCard";
import { VariableSelector } from "@/app/projects/[id]/application/VariableSelector";
import {
  AutosaveInput,
  AutosaveTextarea,
  CheckboxField,
  SelectField,
} from "@/components/form/AutosaveField";
import {
  Badge,
  Button,
  Card,
  Callout,
  EmptyState,
  LinkButton,
  SectionHeading,
  cx,
} from "@/components/ui/primitives";
import { DOCUMENT_DESCRIPTIONS, DOCUMENT_LABELS } from "@/lib/data/documents";
import { governingConstraints, intersectCoverage } from "@/lib/recommendations/compatibility";
import type { ApplicationDraft, Dataset, DocumentRecord, Project, Recommendation } from "@/lib/types";
import type { WorkspaceAction } from "@/lib/store/reducer";

const STEPS = [
  { id: "purpose", label: "Purpose", section: "purpose" },
  { id: "scope", label: "Scope and variables", section: "scope" },
  { id: "method", label: "Analysis and linkage", section: "method" },
  { id: "governance", label: "Documentation", section: "governance" },
  { id: "outputs", label: "Duration and outputs", section: "outputs" },
] as const;

type StepId = (typeof STEPS)[number]["id"];

const PURPOSE_CATEGORIES = [
  { value: "", label: "Select a purpose category…" },
  { value: "scientific-research", label: "Scientific research" },
  { value: "public-health", label: "Public health and surveillance" },
  { value: "healthcare-quality", label: "Healthcare quality and safety" },
  { value: "policy-support", label: "Policy support and planning" },
  { value: "innovation-development", label: "Innovation and development" },
  { value: "education-training", label: "Education and training" },
];

export function ApplicationBuilder({ projectId }: { projectId: string }) {
  return (
    <ProjectShell projectId={projectId}>
      {({ project, datasets, findings, dispatch }) => (
        <BuilderBody project={project} datasets={datasets} findings={findings} dispatch={dispatch} />
      )}
    </ProjectShell>
  );
}

function BuilderBody({
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
  const [step, setStep] = useState<StepId>("purpose");
  const application = project.application;
  const now = () => new Date().toISOString();

  const patch = (values: Partial<ApplicationDraft>, note?: string) =>
    dispatch({ type: "update-application", projectId: project.id, patch: values, now: now(), note });

  const constraints = datasets.length > 0 ? governingConstraints(datasets) : null;
  const coverage = datasets.length > 0 ? intersectCoverage(datasets) : null;

  const stepFindings = useMemo(() => {
    const current = STEPS.find((entry) => entry.id === step)!;
    return findings.filter((finding) => finding.scope.section === current.section);
  }, [findings, step]);

  if (datasets.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <EmptyState
          title="Select datasets before building the application"
          description="The builder derives required documentation, governing access conditions and available variables from the datasets in the project. With none selected there is nothing to build against."
          action={<LinkButton href="/catalogue" variant="primary">Search the catalogue</LinkButton>}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <SectionHeading
        eyebrow="Guided builder"
        title="Mock data-access application"
        description="Everything you type is saved to this browser as you go. Findings for the current step appear alongside the fields, so guidance arrives while you are writing rather than at the end."
      />

      {/* Step nav ---------------------------------------------------------- */}
      <nav aria-label="Application steps" className="mb-6">
        <ol className="flex flex-wrap gap-2">
          {STEPS.map((entry, index) => {
            const count = findings.filter(
              (finding) => finding.scope.section === entry.section,
            ).length;
            const active = step === entry.id;
            return (
              <li key={entry.id}>
                <button
                  type="button"
                  onClick={() => setStep(entry.id)}
                  aria-current={active ? "step" : undefined}
                  className={cx(
                    "flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "border-ink-800 bg-ink-800 text-parchment-50"
                      : "border-ink-300 bg-white text-ink-700 hover:bg-parchment-200",
                  )}
                >
                  <span className={cx("font-mono text-xs", active ? "text-cyan-300" : "text-ink-400")}>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {entry.label}
                  {count > 0 ? (
                    <span
                      className={cx(
                        "rounded-full px-1.5 py-0.5 text-[0.6875rem] font-semibold tabular-nums",
                        active ? "bg-cyan-600 text-white" : "bg-amber-100 text-amber-900",
                      )}
                    >
                      {count}
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          {step === "purpose" ? (
            <Card>
              <h2 className="text-lg font-semibold">Research purpose and public interest</h2>
              <p className="prose-body mt-1.5">
                This section anchors everything else. The minimisation review reads it to judge
                whether each requested variable has a visible role, and the purpose-concern rules
                read it for wording a reviewer would query.
              </p>
              <div className="mt-5 space-y-5">
                <AutosaveTextarea
                  label="Research purpose"
                  required
                  guideWords={40}
                  rows={6}
                  value={application.researchPurpose}
                  onCommit={(value) => patch({ researchPurpose: value })}
                  hint="State the question, the exposure and outcome if there are any, and what you intend to estimate. Write it so a reviewer outside your field could follow it."
                  placeholder="This study examines whether…"
                />
                <SelectField
                  label="Purpose category"
                  required
                  value={application.purposeCategory}
                  options={PURPOSE_CATEGORIES}
                  onChange={(value) =>
                    patch({ purposeCategory: value as ApplicationDraft["purposeCategory"] })
                  }
                  hint="Determines which permitted-purpose list each dataset is assessed against."
                />
                <AutosaveTextarea
                  label="Public-interest justification"
                  required
                  guideWords={30}
                  rows={5}
                  value={application.publicInterestJustification}
                  onCommit={(value) => patch({ publicInterestJustification: value })}
                  hint="Name who benefits and what changes if the study succeeds. Public interest is usually assessed separately from scientific merit."
                />
              </div>

              {datasets.length > 0 ? (
                <div className="mt-6 border-t border-ink-100 pt-5">
                  <h3 className="text-sm font-semibold">Permitted purposes across your datasets</h3>
                  <p className="mt-1 text-xs text-ink-500">
                    Check that your purpose falls inside every list. These are fictional.
                  </p>
                  <ul className="mt-3 space-y-3">
                    {datasets.map((dataset) => (
                      <li key={dataset.id} className="text-sm">
                        <span className="font-medium text-ink-800">{dataset.acronym}</span>
                        <ul className="mt-1 flex flex-wrap gap-1.5">
                          {dataset.permittedPurposes.map((purpose) => (
                            <li key={purpose}>
                              <Badge tone="positive">{purpose}</Badge>
                            </li>
                          ))}
                        </ul>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </Card>
          ) : null}

          {step === "scope" ? (
            <>
              <Card>
                <h2 className="text-lg font-semibold">Population and time period</h2>
                <div className="mt-5 space-y-5">
                  <AutosaveTextarea
                    label="Population description"
                    required
                    guideWords={25}
                    rows={4}
                    value={application.populationDescription}
                    onCommit={(value) => patch({ populationDescription: value })}
                    hint="Inclusion and exclusion criteria, index event definition, and any residency or follow-up requirements."
                  />
                  <div className="grid gap-4 sm:grid-cols-3">
                    <AutosaveInput
                      label="Study period from"
                      type="date"
                      required
                      value={application.timePeriod.start}
                      onCommit={(value) =>
                        patch({ timePeriod: { ...application.timePeriod, start: value } })
                      }
                    />
                    <AutosaveInput
                      label="Study period to"
                      type="date"
                      required
                      value={application.timePeriod.end}
                      onCommit={(value) =>
                        patch({ timePeriod: { ...application.timePeriod, end: value } })
                      }
                    />
                    <AutosaveInput
                      label="Estimated cohort size"
                      value={application.estimatedCohortSize}
                      onCommit={(value) => patch({ estimatedCohortSize: value })}
                      placeholder="e.g. Approximately 180,000"
                    />
                  </div>
                  {coverage?.valid ? (
                    <p className="text-xs text-ink-500">
                      Every dataset in this project holds records for {coverage.start}–{coverage.end}.
                      A study period outside that window will draw on fewer sources.
                    </p>
                  ) : null}
                </div>
              </Card>

              <VariableSelector project={project} datasets={datasets} dispatch={dispatch} />
            </>
          ) : null}

          {step === "method" ? (
            <Card>
              <h2 className="text-lg font-semibold">Analysis plan and linkage</h2>
              <p className="prose-body mt-1.5">
                The analysis plan is what makes the variable request assessable. A reviewer who can
                see how each variable is consumed does not have to guess at necessity.
              </p>
              <div className="mt-5 space-y-5">
                <AutosaveTextarea
                  label="Analysis plan"
                  required
                  guideWords={60}
                  rows={8}
                  value={application.analysisPlan}
                  onCommit={(value) => patch({ analysisPlan: value })}
                  hint="Design, exposure and outcome definitions, follow-up, adjustment strategy, and any sensitivity analyses."
                />
                <AutosaveTextarea
                  label="Statistical methods"
                  required
                  guideWords={25}
                  rows={4}
                  value={application.statisticalMethods}
                  onCommit={(value) => patch({ statisticalMethods: value })}
                  hint="Models, missing-data handling, and how assumptions will be checked."
                />
                <div className="surface-muted p-4">
                  <CheckboxField
                    label="This study requires record-level linkage between datasets"
                    description="Linkage increases analytical power and re-identification risk together, so it is assessed separately from the rest of the request."
                    checked={application.linkageRequested}
                    onChange={(value) => patch({ linkageRequested: value })}
                  />
                  {application.linkageRequested ? (
                    <div className="mt-4">
                      <AutosaveTextarea
                        label="Linkage justification"
                        guideWords={20}
                        rows={4}
                        value={application.linkageJustification}
                        onCommit={(value) => patch({ linkageJustification: value })}
                        hint="Which question needs linked records, and why a design without linkage would not answer it."
                      />
                      <div className="mt-3 space-y-1.5">
                        {datasets.map((dataset) => (
                          <p key={dataset.id} className="text-xs text-ink-600">
                            <span className="font-medium">{dataset.acronym}:</span>{" "}
                            {dataset.linkage.status}
                          </p>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </Card>
          ) : null}

          {step === "governance" ? (
            <>
              <Card>
                <h2 className="text-lg font-semibold">Legal and ethical documentation</h2>
                <p className="prose-body mt-1.5">
                  Notes here are your own record of the position you intend to rely on. This
                  prototype draws no legal conclusions and cannot confirm any of it.
                </p>
                <div className="mt-5 space-y-5">
                  <AutosaveTextarea
                    label="Legal basis note"
                    guideWords={25}
                    rows={4}
                    value={application.legalBasisNote}
                    onCommit={(value) => patch({ legalBasisNote: value })}
                    hint="What your legal advisers have said, and what still needs confirming with each access body."
                  />
                  <AutosaveTextarea
                    label="Ethics note"
                    guideWords={25}
                    rows={4}
                    value={application.ethicsNote}
                    onCommit={(value) => patch({ ethicsNote: value })}
                    hint="Which committee approved the study, what the approval covers, and what it does not."
                  />
                </div>
              </Card>

              <DocumentChecklist
                application={application}
                datasets={datasets}
                onChange={(documents) => patch({ documents })}
              />

              <Card>
                <h2 className="text-lg font-semibold">Attestations</h2>
                <p className="prose-body mt-1.5">
                  Recorded declarations. In a real process these carry weight; here they demonstrate
                  where such declarations sit in an application.
                </p>
                <div className="mt-5 space-y-4">
                  <CheckboxField
                    label="No attempt will be made to re-identify individuals"
                    description="Every dataset in this fictional catalogue prohibits re-identification by any means."
                    checked={application.attestations.noReidentification}
                    onChange={(value) =>
                      patch({
                        attestations: { ...application.attestations, noReidentification: value },
                      })
                    }
                  />
                  <CheckboxField
                    label="Analysis will take place only in the approved secure processing environment"
                    description={
                      constraints?.secureEnvironmentRequired
                        ? "At least one dataset in this project requires a secure processing environment."
                        : "No dataset in this project currently requires one, but the commitment is still recorded."
                    }
                    checked={application.attestations.secureEnvironmentOnly}
                    onChange={(value) =>
                      patch({
                        attestations: { ...application.attestations, secureEnvironmentOnly: value },
                      })
                    }
                  />
                  <CheckboxField
                    label="Output checking by the data holder is accepted"
                    description={
                      constraints
                        ? `Assume the strictest minimum cell size across your datasets: ${constraints.aggregationThreshold}.`
                        : undefined
                    }
                    checked={application.attestations.outputCheckingAccepted}
                    onChange={(value) =>
                      patch({
                        attestations: { ...application.attestations, outputCheckingAccepted: value },
                      })
                    }
                  />
                  <CheckboxField
                    label="I understand the guidance in this prototype is educational"
                    description="It contains no legal conclusions and must be confirmed with the relevant legal, ethical and data-access authorities."
                    checked={application.attestations.guidanceIsEducational}
                    onChange={(value) =>
                      patch({
                        attestations: { ...application.attestations, guidanceIsEducational: value },
                      })
                    }
                  />
                </div>
              </Card>
            </>
          ) : null}

          {step === "outputs" ? (
            <Card>
              <h2 className="text-lg font-semibold">Duration, outputs and retention</h2>
              <div className="mt-5 space-y-5">
                <AutosaveInput
                  label="Requested access period (months)"
                  type="number"
                  required
                  min={1}
                  max={60}
                  value={application.requestedAccessMonths}
                  onCommit={(value) =>
                    patch({ requestedAccessMonths: value === "" ? "" : Number(value) })
                  }
                  hint={
                    constraints
                      ? `The shortest maximum across your datasets is ${constraints.maximumAccessMonths} months.`
                      : undefined
                  }
                />
                <AutosaveTextarea
                  label="Expected outputs"
                  required
                  guideWords={30}
                  rows={5}
                  value={application.expectedOutputs}
                  onCommit={(value) => patch({ expectedOutputs: value })}
                  hint="Publications, aggregate tables, code releases. Be specific about what leaves the environment."
                />
                <AutosaveTextarea
                  label="Output disclosure controls"
                  guideWords={20}
                  rows={4}
                  value={application.outputDisclosureControls}
                  onCommit={(value) => patch({ outputDisclosureControls: value })}
                  hint="Suppression rules you will apply before submitting anything for output checking."
                />
                <AutosaveTextarea
                  label="Retention plan"
                  rows={3}
                  value={application.retentionPlan}
                  onCommit={(value) => patch({ retentionPlan: value })}
                  hint="What is retained during the access period, and where."
                />
                <AutosaveTextarea
                  label="Data destruction plan"
                  guideWords={20}
                  rows={4}
                  value={application.dataDestructionPlan}
                  onCommit={(value) => patch({ dataDestructionPlan: value })}
                  hint="What happens when the access period ends, who confirms it, and what may legitimately be kept."
                />
              </div>
            </Card>
          ) : null}

          {/* Step controls ------------------------------------------------- */}
          <div className="flex items-center justify-between gap-3">
            <Button
              onClick={() => {
                const index = STEPS.findIndex((entry) => entry.id === step);
                if (index > 0) setStep(STEPS[index - 1].id);
              }}
              disabled={step === STEPS[0].id}
            >
              ← Previous
            </Button>
            {step === STEPS[STEPS.length - 1].id ? (
              <LinkButton href={`/projects/${project.id}/readiness`} variant="primary">
                Review readiness →
              </LinkButton>
            ) : (
              <Button
                variant="primary"
                onClick={() => {
                  const index = STEPS.findIndex((entry) => entry.id === step);
                  if (index < STEPS.length - 1) setStep(STEPS[index + 1].id);
                }}
              >
                Next →
              </Button>
            )}
          </div>
        </div>

        {/* Sidebar --------------------------------------------------------- */}
        <div className="space-y-6">
          <Card>
            <h2 className="mb-2 text-base font-semibold">Guidance for this step</h2>
            <p className="mb-3 text-xs text-ink-500">
              Produced by fixed rules, updated as you type. Advisory only.
            </p>
            {stepFindings.length === 0 ? (
              <p className="text-sm text-ink-600">
                Nothing raised for this step. That is not a sign the section is complete — the rules
                only check for presence and clarity, never correctness.
              </p>
            ) : (
              <div className="space-y-3">
                {stepFindings.map((finding) => (
                  <RecommendationCard key={finding.id} finding={finding} compact />
                ))}
              </div>
            )}
          </Card>

          <Card>
            <h2 className="mb-3 text-base font-semibold">Request summary</h2>
            <dl className="space-y-2 text-sm">
              {[
                { term: "Datasets", value: String(datasets.length) },
                { term: "Variables", value: String(application.requestedVariables.length) },
                {
                  term: "Documents attached",
                  value: `${application.documents.filter((document) => document.status === "attached").length} / ${application.documents.length}`,
                },
                {
                  term: "Attestations",
                  value: `${Object.values(application.attestations).filter(Boolean).length} / 4`,
                },
              ].map((item) => (
                <div key={item.term} className="flex justify-between gap-3">
                  <dt className="text-ink-500">{item.term}</dt>
                  <dd className="font-medium tabular-nums text-ink-800">{item.value}</dd>
                </div>
              ))}
            </dl>
            <Link
              href={`/projects/${project.id}/minimisation`}
              className="mt-4 block text-sm font-medium text-cyan-800 hover:underline"
            >
              Run the data-minimisation review →
            </Link>
          </Card>

          <Callout tone="caution" title="Educational guidance only">
            This builder produces a mock application. It draws no legal conclusions and cannot be
            submitted anywhere. Confirm every requirement with the competent authority.
          </Callout>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function DocumentChecklist({
  application,
  datasets,
  onChange,
}: {
  application: ApplicationDraft;
  datasets: Dataset[];
  onChange: (documents: DocumentRecord[]) => void;
}) {
  const required = new Set(datasets.flatMap((dataset) => dataset.accessConditions.requiredDocuments));

  function update(id: DocumentRecord["id"], values: Partial<DocumentRecord>) {
    onChange(
      application.documents.map((document) =>
        document.id === id ? { ...document, ...values } : document,
      ),
    );
  }

  const ordered = [...application.documents].sort((a, b) => {
    const aRequired = required.has(a.id) ? 0 : 1;
    const bRequired = required.has(b.id) ? 0 : 1;
    return aRequired - bRequired || DOCUMENT_LABELS[a.id].localeCompare(DOCUMENT_LABELS[b.id]);
  });

  return (
    <Card>
      <h2 className="text-lg font-semibold">Documentation checklist</h2>
      <p className="prose-body mt-1.5">
        Requirements are the union of what every dataset in this project asks for. Adding a dataset
        can silently introduce a new obligation, which is why this list is derived rather than fixed.
      </p>
      <ul className="mt-5 divide-y divide-ink-100">
        {ordered.map((document) => {
          const isRequired = required.has(document.id);
          const requiredBy = datasets
            .filter((dataset) => dataset.accessConditions.requiredDocuments.includes(document.id))
            .map((dataset) => dataset.acronym);
          return (
            <li key={document.id} className="py-4 first:pt-0">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-ink-900">
                      {DOCUMENT_LABELS[document.id]}
                    </h3>
                    {isRequired ? (
                      <Badge tone="caution">Required by {requiredBy.join(", ")}</Badge>
                    ) : (
                      <Badge>Optional for this project</Badge>
                    )}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-ink-600">
                    {DOCUMENT_DESCRIPTIONS[document.id]}
                  </p>
                </div>
                <div className="w-full sm:w-48">
                  <label
                    htmlFor={`status-${document.id}`}
                    className="sr-only"
                  >{`Status for ${DOCUMENT_LABELS[document.id]}`}</label>
                  <select
                    id={`status-${document.id}`}
                    className="input py-1.5 text-sm"
                    value={document.status}
                    onChange={(event) =>
                      update(document.id, { status: event.target.value as DocumentRecord["status"] })
                    }
                  >
                    <option value="not-started">Not started</option>
                    <option value="in-preparation">In preparation</option>
                    <option value="attached">Attached</option>
                  </select>
                </div>
              </div>

              {document.status !== "not-started" ? (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor={`ref-${document.id}`} className="text-xs font-medium text-ink-600">
                      Reference
                    </label>
                    <input
                      id={`ref-${document.id}`}
                      className="input mt-1 py-1.5 text-sm"
                      value={document.reference}
                      placeholder="e.g. ETH-2026-0431"
                      onChange={(event) => update(document.id, { reference: event.target.value })}
                    />
                  </div>
                  <div>
                    <label htmlFor={`note-${document.id}`} className="text-xs font-medium text-ink-600">
                      Note
                    </label>
                    <input
                      id={`note-${document.id}`}
                      className="input mt-1 py-1.5 text-sm"
                      value={document.note}
                      placeholder="Expected date, outstanding signature, scope…"
                      onChange={(event) => update(document.id, { note: event.target.value })}
                    />
                  </div>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
      <p className="mt-4 text-xs text-ink-500">
        Attaching a document here records that you hold it. No file is uploaded — this prototype has
        no server and stores nothing beyond the text on this page.
      </p>
    </Card>
  );
}
