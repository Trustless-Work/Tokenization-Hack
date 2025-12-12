import * as React from "react";
import { Button } from "../../../../../components/button";
import { useEscrowsMutations } from "../../../../tanstack/useEscrowsMutations";
import { useWalletContext } from "../../../../wallet-kit/WalletProvider";
import {
  MultiReleaseStartDisputePayload,
  MultiReleaseMilestone,
} from "@trustless-work/escrow/types";
import { toast } from "sonner";
import {
  ErrorResponse,
  handleError,
} from "../../../../handle-errors/handle";
import { useEscrowContext } from "../../../../providers/EscrowProvider";
import { Loader2 } from "lucide-react";

type DisputeMilestoneButtonProps = {
  milestoneIndex: number | string;
};

export const DisputeMilestoneButton = ({
  milestoneIndex,
}: DisputeMilestoneButtonProps) => {
  const { startDispute } = useEscrowsMutations();
  const { selectedEscrow, updateEscrow } = useEscrowContext();
  const { walletAddress } = useWalletContext();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  async function handleClick() {
    try {
      setIsSubmitting(true);

      /**
       * Create the payload for the dispute escrow mutation
       *
       * @returns The payload for the dispute escrow mutation
       */
      const payload: MultiReleaseStartDisputePayload = {
        contractId: selectedEscrow?.contractId || "",
        signer: walletAddress || "",
        milestoneIndex: String(milestoneIndex),
      };

      /**
       * Call the dispute escrow mutation
       *
       * @param payload - The payload for the dispute escrow mutation
       * @param type - The type of the escrow
       * @param address - The address of the escrow
       */
      await startDispute.mutateAsync({
        payload,
        type: "multi-release",
        address: walletAddress || "",
      });

      updateEscrow({
        ...selectedEscrow,
        milestones: selectedEscrow?.milestones.map((milestone, index) => {
          if (index === Number(milestoneIndex)) {
            return {
              ...milestone,
              flags: {
                ...(milestone as MultiReleaseMilestone).flags,
                disputed: true,
              },
            };
          }
          return milestone;
        }),
      });
    } catch (error) {
      toast.error(handleError(error as ErrorResponse).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Button
      type="button"
      disabled={isSubmitting || !selectedEscrow?.balance}
      onClick={handleClick}
      className="cursor-pointer w-full"
    >
      {isSubmitting ? (
        <div className="flex items-center">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="ml-2">Disputing...</span>
        </div>
      ) : (
        "Dispute Milestone"
      )}
    </Button>
  );
};
