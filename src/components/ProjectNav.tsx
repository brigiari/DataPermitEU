"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Project } from "@/lib/types";
import { cx } from "@/components/ui/primitives";
import { StatusBadge } from "@/components/StatusBadge";

/**
 * Secondary navigation for a single project.
 *
 * Counts on the tabs are live: they read the same findings the destination
 * pages render, so a user can see where the open work is without visiting
 * every step.
 */
export function ProjectNav({
  project,
  counts,
}: {
  project: Project;
  counts: { compatibility: number; minimisation: number; readiness: number };
}) {
  const pathname = usePathname();
  const base = `/projects/${project.id}`;

  const tabs = [
    { href: base, label: "Overview", count: 0 },
    { href: `${base}/compare`, label: "Compare datasets", count: counts.compatibility },
    { href: `${base}/application`, label: "Application builder", count: 0 },
    { href: `${base}/minimisation`, label: "Data minimisation", count: counts.minimisation },
    { href: `${base}/readiness`, label: "Readiness", count: counts.readiness },
  ];

  return (
    <div className="border-b border-ink-200 bg-white no-print">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pb-2 pt-4">
          <Link href="/projects" className="text-sm text-ink-500 hover:text-ink-800 hover:underline">
            ← All projects
          </Link>
          <StatusBadge status={project.status} />
          {project.mockReference ? (
            <span className="font-mono text-xs text-ink-500">{project.mockReference}</span>
          ) : null}
        </div>
        <h1 className="pb-3 text-xl font-semibold sm:text-2xl">{project.title}</h1>

        <nav aria-label="Project sections">
          <ul className="-mb-px flex flex-wrap gap-1 overflow-x-auto">
            {tabs.map((tab) => {
              const active = pathname === tab.href;
              return (
                <li key={tab.href}>
                  <Link
                    href={tab.href}
                    aria-current={active ? "page" : undefined}
                    className={cx(
                      "inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "border-cyan-600 text-ink-900"
                        : "border-transparent text-ink-600 hover:border-ink-300 hover:text-ink-900",
                    )}
                  >
                    {tab.label}
                    {tab.count > 0 ? (
                      <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[0.6875rem] font-semibold tabular-nums text-amber-900">
                        {tab.count}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}
