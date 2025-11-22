import { Suspense } from "react";
import { ProjectUpdatesView } from "@/features/project-updates/ProjectUpdatesView";

export default function ProjectUpdates() {
  return (
    <Suspense fallback={null}>
      <ProjectUpdatesView />
    </Suspense>
  );
}
