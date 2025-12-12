import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { approveMilestoneSchema, type ApproveMilestoneValues } from "./schema";
import { toast } from "sonner";
import {
  ApproveMilestonePayload,
  MultiReleaseMilestone,
} from "@trustless-work/escrow";
import { useEscrowContext } from "../../../../providers/EscrowProvider";
import { useEscrowsMutations } from "../../../../tanstack/useEscrowsMutations";
import {
  ErrorResponse,
  handleError,
} from "../../../../handle-errors/handle";
import { useWalletContext } from "../../../../wallet-kit/WalletProvider";

type UseApproveMilestoneOptions = {
  onSuccess?: () => void;
};

export function useApproveMilestone(options?: UseApproveMilestoneOptions) {
  const { approveMilestone } = useEscrowsMutations();
  const { selectedEscrow, updateEscrow } = useEscrowContext();
  const { walletAddress } = useWalletContext();

  const form = useForm<ApproveMilestoneValues>({
    resolver: zodResolver(approveMilestoneSchema),
    defaultValues: {
      milestoneIndex: "0",
    },
    mode: "onChange",
  });

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = form.handleSubmit(async (payload) => {
    try {
      setIsSubmitting(true);

      const finalPayload: ApproveMilestonePayload = {
        contractId: selectedEscrow?.contractId || "",
        milestoneIndex: payload.milestoneIndex,
        approver: walletAddress || "",
      };

      await approveMilestone.mutateAsync({
        payload: finalPayload,
        type: selectedEscrow?.type || "multi-release",
        address: walletAddress || "",
      });

      toast.success("Milestone approved flag updated successfully");

      updateEscrow({
        ...selectedEscrow,
        milestones: selectedEscrow?.milestones.map((milestone, index) => {
          if (index === Number(payload.milestoneIndex)) {
            if (selectedEscrow?.type === "single-release") {
              return { ...milestone, approved: true };
            } else {
              return {
                ...milestone,
                flags: {
                  ...(milestone as MultiReleaseMilestone).flags,
                  approved: true,
                },
              };
            }
          }
          return milestone;
        }),
      });

      // Close dialog if requested
      options?.onSuccess?.();
    } catch (error) {
      toast.error(handleError(error as ErrorResponse).message);
    } finally {
      setIsSubmitting(false);
      form.reset();
    }
  });

  return { form, handleSubmit, isSubmitting };
}
