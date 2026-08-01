import type { Metadata } from "next";
import { PrintView } from "@/app/projects/[id]/readiness/print/PrintView";

export const metadata: Metadata = {
  title: "Print-ready application",
  description: "A PDF-ready rendering of the mock application, suitable for printing to file.",
  robots: { index: false, follow: false },
};

export default async function PrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PrintView projectId={id} />;
}
