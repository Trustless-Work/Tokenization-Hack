import { VaultList } from "./VaultList";

export const ClaimROIView = () => {
  return (
    <div className="flex flex-col gap-5 mt-10 w-full">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold">Claim ROI</h2>
        <p className="text-muted-foreground">
          View your ROI for each vault and claim your rewards.
        </p>
      </div>

      <VaultList />
    </div>
  );
};
