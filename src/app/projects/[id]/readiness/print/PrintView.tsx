"use client";

import Link from "next/link";
import { useProject } from "@/lib/store/WorkspaceProvider";
import { buildApplicationExport, EXPORT_DISCLAIMER } from "@/lib/export";
import { DOCUMENT_LABELS } from "@/lib/data/documents";
import { Button, EmptyState } from "@/components/ui/primitives";
import { STATUS_LABELS } from "@/components/StatusBadge";
import { getVariable } from "@/lib/data/datasets";

/**
 * PDF-ready view.
 *
 * Rendered as plain semantic HTML with a print stylesheet rather than a
 * generated PDF: the browser's own "print to PDF" produces a selectable,
 * accessible document, and it keeps the prototype free of a rendering
 * dependency and any server round-trip.
 */
export function PrintView({ projectId }: { projectId: string }) {
  const { project, datasets, findings, hydrated } = useProject(projectId);

  if (!hydrated) {
    return <div className="mx-auto max-w-3xl px-6 py-16" aria-busy="true" />;
  }

  if (!project) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState
          title="Project not found"
          description="This project does not exist in this browser."
          action={
            <Link href="/projects" className="text-sm font-medium text-cyan-800 hover:underline">
              Back to all projects →
            </Link>
          }
        />
      </div>
    );
  }

  const payload = buildApplicationExport(project, datasets, findings, new Date().toISOString());
  const application = project.application;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="no-print mb-6 flex flex-wrap items-center gap-3">
        <Link
          href={`/projects/${project.id}/readiness`}
          className="text-sm text-ink-600 hover:underline"
        >
          ← Back to readiness
        </Link>
        <Button variant="primary" className="ml-auto" onClick={() => window.print()}>
          Print or save as PDF
        </Button>
      </div>

      <article className="surface p-8 print:border-0 print:p-0">
        <div className="mb-6 rounded border-2 border-gold-400 bg-gold-50 p-4 text-xs leading-relaxed text-ink-800">
          <strong className="block">FICTIONAL PROTOTYPE OUTPUT — NOT AN OFFICIAL FORM</strong>
          <p className="mt-1">{EXPORT_DISCLAIMER}</p>
        </div>

        <header className="border-b-2 border-ink-800 pb-4">
          <p className="text-xs uppercase tracking-widest text-ink-500">
            DataPermit EU · Mock data-access application
          </p>
          <h1 className="mt-1 text-2xl">{project.title}</h1>
          <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
            <div className="flex gap-2">
              <dt className="text-ink-500">Status:</dt>
              <dd className="font-medium">{STATUS_LABELS[project.status]}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-ink-500">Reference:</dt>
              <dd className="font-mono">{project.mockReference ?? "not assigned"}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-ink-500">Principal investigator:</dt>
              <dd>{project.principalInvestigator || "not recorded"}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-ink-500">Institution:</dt>
              <dd>{project.institution || "not recorded"}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-ink-500">Generated:</dt>
              <dd>{new Date(payload.generatedAt).toLocaleString("en-GB")}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-ink-500">Readiness:</dt>
              <dd>
                {payload.readiness.overall}/100 — {payload.readiness.band}
              </dd>
            </div>
          </dl>
        </header>

        <Section title="Research question">
          <p>{project.researchQuestion}</p>
        </Section>

        <Section title="1. Research purpose">
          <Field label="Purpose category" value={application.purposeCategory || "not selected"} />
          <Prose>{application.researchPurpose}</Prose>
          <h3 className="mt-4 text-sm font-semibold">Public-interest justification</h3>
          <Prose>{application.publicInterestJustification}</Prose>
        </Section>

        <Section title="2. Datasets requested">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-ink-300 text-left text-xs uppercase text-ink-500">
                <th scope="col" className="py-1.5 pr-3">Dataset</th>
                <th scope="col" className="py-1.5 pr-3">Country</th>
                <th scope="col" className="py-1.5 pr-3">Access body</th>
                <th scope="col" className="py-1.5">Variables</th>
              </tr>
            </thead>
            <tbody>
              {payload.datasets.map((dataset) => (
                <tr key={dataset.id} className="border-b border-ink-100">
                  <td className="py-1.5 pr-3">
                    <span className="font-medium">{dataset.acronym}</span> — {dataset.name}
                  </td>
                  <td className="py-1.5 pr-3">{dataset.country}</td>
                  <td className="py-1.5 pr-3">{dataset.accessBody}</td>
                  <td className="py-1.5 tabular-nums">{dataset.requestedVariableCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {payload.combinedConstraints.countries.length > 0 ? (
            <p className="mt-3 text-xs text-ink-600">
              Governing conditions (strictest across all selected datasets): minimum cell size{" "}
              {payload.combinedConstraints.minimumAggregationThreshold}, maximum access{" "}
              {payload.combinedConstraints.maximumAccessMonths} months, secure processing environment{" "}
              {payload.combinedConstraints.secureProcessingEnvironmentRequired ? "required" : "not required"}
              {payload.combinedConstraints.sharedCoverage
                ? `, shared coverage ${payload.combinedConstraints.sharedCoverage.start}–${payload.combinedConstraints.sharedCoverage.end}`
                : ", no shared coverage window"}
              .
            </p>
          ) : null}
        </Section>

        <Section title="3. Population and study period">
          <Field
            label="Study period"
            value={`${application.timePeriod.start || "not set"} to ${application.timePeriod.end || "not set"}`}
          />
          <Field label="Estimated cohort size" value={application.estimatedCohortSize || "not recorded"} />
          <Prose>{application.populationDescription}</Prose>
        </Section>

        <Section title="4. Requested variables">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-ink-300 text-left uppercase text-ink-500">
                <th scope="col" className="py-1.5 pr-2">Variable</th>
                <th scope="col" className="py-1.5 pr-2">Dataset</th>
                <th scope="col" className="py-1.5 pr-2">Sensitivity</th>
                <th scope="col" className="py-1.5 pr-2">Granularity</th>
                <th scope="col" className="py-1.5">Justification</th>
              </tr>
            </thead>
            <tbody>
              {application.requestedVariables.map((requested) => {
                const variable = getVariable(requested.datasetId, requested.variableId);
                const dataset = datasets.find((candidate) => candidate.id === requested.datasetId);
                return (
                  <tr key={`${requested.datasetId}-${requested.variableId}`} className="border-b border-ink-100 align-top">
                    <td className="py-1.5 pr-2 font-medium">{variable?.name ?? requested.variableId}</td>
                    <td className="py-1.5 pr-2">{dataset?.acronym ?? requested.datasetId}</td>
                    <td className="py-1.5 pr-2">{variable?.sensitivity ?? "—"}</td>
                    <td className="py-1.5 pr-2">{requested.granularity}</td>
                    <td className="py-1.5">{requested.justification || "— none recorded —"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Section>

        <Section title="5. Analysis plan">
          <Prose>{application.analysisPlan}</Prose>
          <h3 className="mt-4 text-sm font-semibold">Statistical methods</h3>
          <Prose>{application.statisticalMethods}</Prose>
          <h3 className="mt-4 text-sm font-semibold">Record linkage</h3>
          <Field label="Linkage requested" value={application.linkageRequested ? "Yes" : "No"} />
          {application.linkageRequested ? <Prose>{application.linkageJustification}</Prose> : null}
        </Section>

        <Section title="6. Legal and ethical documentation">
          <h3 className="text-sm font-semibold">Legal basis note</h3>
          <Prose>{application.legalBasisNote}</Prose>
          <h3 className="mt-4 text-sm font-semibold">Ethics note</h3>
          <Prose>{application.ethicsNote}</Prose>
          <h3 className="mt-4 text-sm font-semibold">Documentation</h3>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-ink-300 text-left text-xs uppercase text-ink-500">
                <th scope="col" className="py-1.5 pr-3">Document</th>
                <th scope="col" className="py-1.5 pr-3">Status</th>
                <th scope="col" className="py-1.5">Reference</th>
              </tr>
            </thead>
            <tbody>
              {application.documents.map((document) => (
                <tr key={document.id} className="border-b border-ink-100">
                  <td className="py-1.5 pr-3">{DOCUMENT_LABELS[document.id]}</td>
                  <td className="py-1.5 pr-3">{document.status}</td>
                  <td className="py-1.5 font-mono text-xs">{document.reference || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        <Section title="7. Duration, outputs and retention">
          <Field
            label="Requested access period"
            value={
              application.requestedAccessMonths === ""
                ? "not set"
                : `${application.requestedAccessMonths} months`
            }
          />
          <h3 className="mt-3 text-sm font-semibold">Expected outputs</h3>
          <Prose>{application.expectedOutputs}</Prose>
          <h3 className="mt-4 text-sm font-semibold">Output disclosure controls</h3>
          <Prose>{application.outputDisclosureControls}</Prose>
          <h3 className="mt-4 text-sm font-semibold">Retention and destruction</h3>
          <Prose>{application.retentionPlan}</Prose>
          <Prose>{application.dataDestructionPlan}</Prose>
        </Section>

        <Section title="8. Attestations">
          <ul className="space-y-1 text-sm">
            {[
              ["No attempt will be made to re-identify individuals", application.attestations.noReidentification],
              ["Analysis only in the approved secure processing environment", application.attestations.secureEnvironmentOnly],
              ["Output checking by the data holder is accepted", application.attestations.outputCheckingAccepted],
              ["Prototype guidance is understood to be educational only", application.attestations.guidanceIsEducational],
            ].map(([label, checked]) => (
              <li key={String(label)}>
                <span className="font-mono">[{checked ? "×" : " "}]</span> {label}
              </li>
            ))}
          </ul>
        </Section>

        <Section title="9. Open findings at time of export">
          {payload.openFindings.length === 0 ? (
            <p className="text-sm">None outstanding.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {payload.openFindings.map((finding) => (
                <li key={finding.id} className="border-l-2 border-ink-300 pl-3">
                  <p className="font-medium">
                    <span className="font-mono text-xs">{finding.ruleId}</span> · {finding.severity} ·{" "}
                    {finding.title}
                  </p>
                  <p className="mt-0.5 text-ink-700">{finding.reason}</p>
                </li>
              ))}
            </ul>
          )}
          {payload.dismissedFindings.length > 0 ? (
            <p className="mt-3 text-xs text-ink-600">
              {payload.dismissedFindings.length} finding(s) were dismissed by the applicant:{" "}
              {payload.dismissedFindings.join(", ")}.
            </p>
          ) : null}
        </Section>

        <Section title="10. Audit trail">
          <ol className="space-y-1 text-xs">
            {project.auditTrail.map((entry) => (
              <li key={entry.id} className="flex gap-2">
                <time dateTime={entry.timestamp} className="w-36 shrink-0 font-mono text-ink-500">
                  {new Date(entry.timestamp).toLocaleDateString("en-GB")}
                </time>
                <span className="w-20 shrink-0 text-ink-500">{entry.actor}</span>
                <span>
                  <span className="font-medium">{entry.action}</span> — {entry.detail}
                </span>
              </li>
            ))}
          </ol>
        </Section>

        <footer className="mt-8 border-t border-ink-300 pt-4 text-xs text-ink-600">
          <p>
            Generated by DataPermit EU, an independent fictional portfolio prototype. Not an official
            European Commission, EHDS, HealthData@EU or national Health Data Access Body document.
            All datasets, requirements and references are invented. Confirm everything with the
            relevant legal, ethical and data-access authorities.
          </p>
        </footer>
      </article>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 break-inside-avoid">
      <h2 className="mb-2 border-b border-ink-200 pb-1 text-base font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Prose({ children }: { children: React.ReactNode }) {
  const text = String(children ?? "").trim();
  if (!text) return <p className="text-sm italic text-ink-500">Not completed.</p>;
  return <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-ink-800">{text}</p>;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <p className="text-sm">
      <span className="text-ink-500">{label}:</span>{" "}
      <span className="font-medium text-ink-900">{value}</span>
    </p>
  );
}
