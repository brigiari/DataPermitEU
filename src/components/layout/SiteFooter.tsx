import Link from "next/link";
import { OFFICIAL_LINKS } from "@/lib/data/learning";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-ink-200 bg-ink-950 text-ink-200 no-print">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <p className="text-sm font-semibold text-parchment-100">DataPermit EU</p>
          <p className="mt-2 text-sm leading-relaxed text-ink-300">
            An independent portfolio prototype exploring how researchers might move from a research
            question to a well-formed, privacy-conscious data-access application.
          </p>
          <p className="mt-4 trust-rule text-xs leading-relaxed text-ink-300">
            Not an official European Commission, EHDS, HealthData@EU or national Health Data Access
            Body service. All datasets, institutions and requirements are fictional. Guidance is
            educational and is not legal advice.
          </p>
        </div>

        <nav aria-label="Footer">
          <p className="text-sm font-semibold text-parchment-100">In this prototype</p>
          <ul className="mt-3 space-y-2 text-sm">
            {[
              { href: "/projects", label: "Research projects" },
              { href: "/catalogue", label: "Dataset catalogue" },
              { href: "/tracker", label: "Mock application tracker" },
              { href: "/learn", label: "EHDS timeline and glossary" },
              { href: "/methodology", label: "Methodology and limitations" },
              { href: "/case-study", label: "Portfolio case study" },
            ].map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-ink-300 hover:text-parchment-50 hover:underline">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <p className="text-sm font-semibold text-parchment-100">Official sources</p>
          <p className="mt-2 text-xs text-ink-400">
            For the real European Health Data Space, go to the source rather than to this prototype.
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {OFFICIAL_LINKS.map((link) => (
              <li key={link.url}>
                <a
                  href={link.url}
                  className="text-cyan-300 hover:text-cyan-200 hover:underline"
                  rel="noopener noreferrer external"
                  target="_blank"
                >
                  {link.label}
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-ink-800">
        <div className="mx-auto max-w-7xl px-4 py-4 text-xs text-ink-400 sm:px-6">
          Built as a portfolio demonstration. Released under the MIT licence. No personal data is
          collected, transmitted or stored anywhere other than this browser.
        </div>
      </div>
    </footer>
  );
}
