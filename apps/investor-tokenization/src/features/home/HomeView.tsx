import { ProjectList } from "../transparency/ProjectList";

export const HomeView = () => {
  return (
    <div className="flex flex-col gap-5 mt-10 w-full">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold">Investor Project Overview</h2>
        <p className="text-muted-foreground">
          View active projects with their escrow progress, milestones, and
          latest updates.
        </p>
      </div>

      <ProjectList />
    </div>
  );
};
