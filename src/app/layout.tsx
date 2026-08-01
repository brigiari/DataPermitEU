import type { Metadata } from "next";
import "./globals.css";
import { WorkspaceProvider } from "@/lib/store/WorkspaceProvider";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

export const metadata: Metadata = {
  title: {
    default: "DataPermit EU — research data discovery and application workspace",
    template: "%s · DataPermit EU",
  },
  description:
    "An independent fictional portfolio prototype exploring how researchers could discover European health datasets and prepare a structured, privacy-conscious data-access application. Not affiliated with the European Commission, EHDS, HealthData@EU or any national Health Data Access Body.",
  robots: { index: true, follow: true },
  applicationName: "DataPermit EU",
  authors: [{ name: "Gloria Brigiari" }],
  keywords: [
    "European Health Data Space",
    "secondary use",
    "health data",
    "data minimisation",
    "portfolio prototype",
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        <WorkspaceProvider>
          <SiteHeader />
          <main id="main" tabIndex={-1}>
            {children}
          </main>
          <SiteFooter />
        </WorkspaceProvider>
      </body>
    </html>
  );
}
