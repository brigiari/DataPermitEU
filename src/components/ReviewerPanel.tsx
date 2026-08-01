"use client";

import { useState } from "react";
import type { Project, ReviewerNote, Role } from "@/lib/types";
import type { WorkspaceAction } from "@/lib/store/reducer";
import { Badge, Button, Card } from "@/components/ui/primitives";

const DECISION_LABELS: Record<ReviewerNote["decision"], string> = {
  comment: "Comment",
  "clarification-requested": "Clarification requested",
  satisfied: "Satisfied",
};

const DECISION_TONES = {
  comment: "neutral",
  "clarification-requested": "caution",
  satisfied: "positive",
} as const;

const SECTIONS = ["purpose", "scope", "method", "governance", "outputs", "compatibility"] as const;

/**
 * The reviewer view.
 *
 * A mock second perspective: in the researcher role the panel shows notes
 * read-only; switching to reviewer in the header adds the ability to write
 * them. There is no authentication behind this — it demonstrates the shape of
 * a two-sided workflow, and says so.
 */
export function ReviewerPanel({
  project,
  role,
  dispatch,
}: {
  project: Project;
  role: Role;
  dispatch: (action: WorkspaceAction) => void;
}) {
  const [section, setSection] = useState<(typeof SECTIONS)[number]>("purpose");
  const [body, setBody] = useState("");
  const [decision, setDecision] = useState<ReviewerNote["decision"]>("comment");

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (body.trim().length < 5) return;
    const timestamp = new Date().toISOString();
    dispatch({
      type: "add-reviewer-note",
      projectId: project.id,
      note: {
        id: `note-${timestamp}-${section}`,
        timestamp,
        section,
        body: body.trim(),
        decision,
      },
    });
    setBody("");
    setDecision("comment");
  }

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold">Reviewer notes</h2>
        <Badge tone={role === "reviewer" ? "gold" : "neutral"}>{role} view</Badge>
      </div>

      {project.reviewerNotes.length === 0 ? (
        <p className="text-sm text-ink-600">No reviewer notes on this project yet.</p>
      ) : (
        <ul className="space-y-3">
          {project.reviewerNotes.map((note) => (
            <li key={note.id} className="border-l-2 border-gold-300 pl-3">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <Badge tone={DECISION_TONES[note.decision]}>{DECISION_LABELS[note.decision]}</Badge>
                <span className="text-xs capitalize text-ink-500">{note.section}</span>
              </div>
              <p className="text-sm leading-relaxed text-ink-700">{note.body}</p>
              <time dateTime={note.timestamp} className="mt-1 block text-xs text-ink-400">
                {new Date(note.timestamp).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </time>
            </li>
          ))}
        </ul>
      )}

      {role === "reviewer" ? (
        <form onSubmit={submit} className="mt-4 border-t border-ink-100 pt-4">
          <label htmlFor="reviewer-section" className="label">
            Section
          </label>
          <select
            id="reviewer-section"
            className="input mt-1 capitalize"
            value={section}
            onChange={(event) => setSection(event.target.value as (typeof SECTIONS)[number])}
          >
            {SECTIONS.map((option) => (
              <option key={option} value={option} className="capitalize">
                {option}
              </option>
            ))}
          </select>

          <label htmlFor="reviewer-body" className="label mt-3">
            Note
          </label>
          <textarea
            id="reviewer-body"
            className="input mt-1 min-h-[5rem]"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="What would you ask the applicant to clarify?"
          />

          <label htmlFor="reviewer-decision" className="label mt-3">
            Outcome
          </label>
          <select
            id="reviewer-decision"
            className="input mt-1"
            value={decision}
            onChange={(event) => setDecision(event.target.value as ReviewerNote["decision"])}
          >
            {(Object.keys(DECISION_LABELS) as ReviewerNote["decision"][]).map((option) => (
              <option key={option} value={option}>
                {DECISION_LABELS[option]}
              </option>
            ))}
          </select>

          <Button type="submit" variant="primary" className="mt-3 w-full" disabled={body.trim().length < 5}>
            Add note
          </Button>
        </form>
      ) : (
        <p className="mt-4 border-t border-ink-100 pt-3 text-xs text-ink-500">
          Switch to the reviewer role in the header to add notes. The role switch is a mock: it
          changes which controls appear and nothing else. There is no authentication in this
          prototype.
        </p>
      )}
    </Card>
  );
}
