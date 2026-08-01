"use client";

import { useState } from "react";
import Link from "next/link";
import type { Recommendation } from "@/lib/types";
import { Badge, Button, cx } from "@/components/ui/primitives";
import { confidenceBand, KIND_LABELS } from "@/lib/recommendations";
import { RULES_BY_ID } from "@/lib/recommendations/rules";
import { DATASETS_BY_ID } from "@/lib/data/datasets";

const SEVERITY_STYLES = {
  attention: { border: "border-l-amber-500", tone: "caution" as const, label: "Needs attention" },
  advisory: { border: "border-l-cyan-500", tone: "cyan" as const, label: "Advisory" },
  info: { border: "border-l-ink-300", tone: "neutral" as const, label: "For information" },
};

/**
 * The single rendering surface for every finding in the product.
 *
 * The layout is a small argument about responsible AI: the claim, then the
 * reason, then the evidence, then the rule that produced it — and a dismiss
 * control, because the user is the decision-maker and the tool is not.
 */
export function RecommendationCard({
  finding,
  onDismiss,
  onRestore,
  dismissed = false,
  compact = false,
}: {
  finding: Recommendation;
  onDismiss?: (finding: Recommendation) => void;
  onRestore?: (finding: Recommendation) => void;
  dismissed?: boolean;
  compact?: boolean;
}) {
  const [showEvidence, setShowEvidence] = useState(false);
  const style = SEVERITY_STYLES[finding.severity];
  const rule = RULES_BY_ID[finding.ruleId];
  const datasets = (finding.scope.datasetIds ?? [])
    .map((id) => DATASETS_BY_ID[id])
    .filter(Boolean);

  return (
    <article
      className={cx(
        "surface border-l-4 p-4",
        style.border,
        dismissed && "opacity-60",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <Badge tone={style.tone}>{style.label}</Badge>
            <Badge>{KIND_LABELS[finding.kind]}</Badge>
            <span className="font-mono text-[0.6875rem] text-ink-500">{finding.ruleId}</span>
            <span className="text-[0.6875rem] text-ink-500">
              Confidence: {confidenceBand(finding.confidence)}
            </span>
            {dismissed ? <Badge tone="neutral">Dismissed</Badge> : null}
          </div>
          <h3 className="text-[0.9375rem] font-semibold text-ink-900">{finding.title}</h3>
        </div>

        {!compact && (onDismiss || onRestore) ? (
          <div className="shrink-0">
            {dismissed ? (
              <Button variant="ghost" onClick={() => onRestore?.(finding)}>
                Restore
              </Button>
            ) : (
              <Button variant="ghost" onClick={() => onDismiss?.(finding)}>
                Dismiss
              </Button>
            )}
          </div>
        ) : null}
      </div>

      <p className="prose-body mt-2">{finding.reason}</p>

      <div className="mt-3 rounded border border-cyan-200 bg-cyan-50/60 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-cyan-900">
          What you could do
        </p>
        <p className="mt-1 text-sm text-ink-800">{finding.suggestedAction}</p>
      </div>

      {datasets.length > 0 ? (
        <p className="mt-3 text-xs text-ink-600">
          Applies to:{" "}
          {datasets.map((dataset, index) => (
            <span key={dataset.id}>
              {index > 0 ? ", " : ""}
              <Link href={`/catalogue/${dataset.id}`} className="font-medium text-cyan-800 hover:underline">
                {dataset.acronym}
              </Link>
            </span>
          ))}
        </p>
      ) : null}

      {!compact ? (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setShowEvidence((value) => !value)}
            aria-expanded={showEvidence}
            className="text-xs font-medium text-ink-600 underline underline-offset-2 hover:text-ink-900"
          >
            {showEvidence ? "Hide" : "Show"} the evidence behind this
          </button>
          {showEvidence ? (
            <div className="mt-2 animate-fade-in rounded border border-ink-200 bg-parchment-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Evidence</p>
              <ul className="mt-1.5 space-y-1 text-sm text-ink-700">
                {finding.evidence.map((item, index) => (
                  <li key={index} className="flex gap-2">
                    <span aria-hidden="true" className="text-ink-400">
                      ·
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              {rule ? (
                <div className="mt-3 border-t border-ink-200 pt-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                    Rule {rule.id} — {rule.title}
                  </p>
                  <p className="mt-1 text-xs text-ink-600">
                    <span className="font-medium">Signal:</span> {rule.signal}
                  </p>
                  <p className="mt-1 text-xs text-ink-600">
                    <span className="font-medium">Known weakness:</span> {rule.knownWeakness}
                  </p>
                  <Link
                    href={`/methodology#${rule.id}`}
                    className="mt-2 inline-block text-xs font-medium text-cyan-800 hover:underline"
                  >
                    Read the full rule definition →
                  </Link>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

/** Groups a list of findings under a heading with a count. */
export function RecommendationList({
  findings,
  emptyMessage,
  onDismiss,
  compact,
}: {
  findings: Recommendation[];
  emptyMessage: string;
  onDismiss?: (finding: Recommendation) => void;
  compact?: boolean;
}) {
  if (findings.length === 0) {
    return (
      <p className="surface-muted p-4 text-sm text-ink-600">{emptyMessage}</p>
    );
  }
  return (
    <div className="space-y-3">
      {findings.map((finding) => (
        <RecommendationCard
          key={finding.id}
          finding={finding}
          onDismiss={onDismiss}
          compact={compact}
        />
      ))}
    </div>
  );
}
