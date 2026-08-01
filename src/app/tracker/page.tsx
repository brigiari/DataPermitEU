import type { Metadata } from "next";
import { TrackerClient } from "@/app/tracker/TrackerClient";

export const metadata: Metadata = {
  title: "Mock application tracker",
  description:
    "A simulated tracker showing where each mock application sits, which access bodies are involved, and what remains outstanding. Nothing is ever transmitted.",
};

export default function TrackerPage() {
  return <TrackerClient />;
}
