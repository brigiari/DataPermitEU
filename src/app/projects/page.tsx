import type { Metadata } from "next";
import { ProjectsClient } from "@/app/projects/ProjectsClient";

export const metadata: Metadata = {
  title: "Research projects",
  description:
    "Create and manage research projects, each anchored on a research question that drives dataset relevance, compatibility and readiness assessment.",
};

export default function ProjectsPage() {
  return <ProjectsClient />;
}
