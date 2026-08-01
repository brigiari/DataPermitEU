"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useWorkspace } from "@/lib/store/WorkspaceProvider";
import { cx } from "@/components/ui/primitives";
import { DisclaimerBanner } from "@/components/PrototypeDisclaimer";

const NAV = [
  { href: "/projects", label: "Projects" },
  { href: "/catalogue", label: "Catalogue" },
  { href: "/tracker", label: "Tracker" },
  { href: "/learn", label: "Learn" },
  { href: "/methodology", label: "Methodology" },
  { href: "/case-study", label: "Case study" },
];

function Wordmark() {
  return (
    <Link href="/" className="group flex items-center gap-2.5" aria-label="DataPermit EU — home">
      {/* An abstract mark: a ring of nodes, deliberately not a circle of stars. */}
      <span
        aria-hidden="true"
        className="grid h-8 w-8 place-items-center rounded-md bg-ink-800 text-parchment-50"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M12 3v4M12 17v4M3 12h4M17 12h4" strokeLinecap="round" />
          <circle cx="12" cy="12" r="3.2" />
          <path d="M6.2 6.2l2.6 2.6M15.2 15.2l2.6 2.6M17.8 6.2l-2.6 2.6M8.8 15.2l-2.6 2.6" strokeLinecap="round" opacity="0.55" />
        </svg>
      </span>
      <span className="leading-tight">
        <span className="block text-[0.9375rem] font-semibold tracking-tight text-ink-900">
          DataPermit <span className="text-cyan-700">EU</span>
        </span>
        <span className="block text-[0.6875rem] uppercase tracking-[0.12em] text-ink-500">
          Research access workspace
        </span>
      </span>
    </Link>
  );
}

function SaveIndicator() {
  const { saveStatus, hydrated } = useWorkspace();
  if (!hydrated) return null;
  const copy: Record<typeof saveStatus, string> = {
    idle: "All changes saved locally",
    saving: "Saving…",
    saved: "Saved to this browser",
    error: "Could not save — storage unavailable",
  };
  return (
    <p
      aria-live="polite"
      className={cx(
        "hidden text-xs lg:block",
        saveStatus === "error" ? "text-rose-700" : "text-ink-500",
      )}
    >
      {copy[saveStatus]}
    </p>
  );
}

/**
 * Role switcher.
 *
 * Mock only: it changes which affordances the interface offers, and nothing
 * else. There is no authentication and no enforcement, which the control says
 * out loud rather than implying otherwise.
 */
function RoleSwitcher() {
  const { role, dispatch } = useWorkspace();
  return (
    <div className="flex items-center gap-2">
      <span className="sr-only" id="role-switcher-label">
        Mock role — changes the interface only, with no authentication
      </span>
      <div
        className="flex rounded-md border border-ink-300 bg-white p-0.5"
        role="group"
        aria-labelledby="role-switcher-label"
      >
        {(["researcher", "reviewer"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => dispatch({ type: "set-role", role: option })}
            aria-pressed={role === option}
            className={cx(
              "rounded px-2.5 py-1 text-xs font-medium capitalize transition-colors",
              role === option ? "bg-ink-800 text-parchment-50" : "text-ink-600 hover:bg-ink-100",
            )}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-ink-200 bg-parchment-50/95 backdrop-blur">
      <DisclaimerBanner />
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
        <Wordmark />

        <nav aria-label="Primary" className="ml-auto hidden items-center gap-0.5 md:flex">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "rounded px-3 py-1.5 text-sm font-medium transition-colors",
                  active ? "bg-ink-100 text-ink-900" : "text-ink-600 hover:bg-ink-50 hover:text-ink-900",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3 md:ml-0">
          <SaveIndicator />
          <div className="hidden sm:block">
            <RoleSwitcher />
          </div>
          <button
            type="button"
            className="rounded border border-ink-300 p-2 md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((value) => !value)}
          >
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              {open ? (
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {open ? (
        <nav
          id="mobile-nav"
          aria-label="Primary (mobile)"
          className="border-t border-ink-200 bg-parchment-50 px-4 py-3 md:hidden"
        >
          <ul className="space-y-1">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block rounded px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-100"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-3 border-t border-ink-200 pt-3 sm:hidden">
            <RoleSwitcher />
          </div>
        </nav>
      ) : null}
    </header>
  );
}
