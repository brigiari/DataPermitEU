import type { Metadata } from "next";
import { ProjectOverview } from "@/app/projects/[id]/ProjectOverview";

export const metadata: Metadata = {
  title: "Project workspace",
  description: "Research question, selected datasets, open findings and audit trail for one project.",
};

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProjectOverview projectId={id} />;
}
