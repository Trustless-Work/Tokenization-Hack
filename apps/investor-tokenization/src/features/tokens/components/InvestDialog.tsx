"use client";

import React from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RainbowButton } from "@/components/ui/rainbow-button";
import {
  TokenService,
  type BuyTokenPayload,
} from "@/features/tokens/services/token.service";
import { SendTransactionService } from "@/lib/sendTransactionService";
import { useWalletContext } from "@/components/tw-blocks/wallet-kit/WalletProvider";
import { signTransaction } from "@/components/tw-blocks/wallet-kit/wallet-kit";
import { useSelectedEscrow } from "@/features/tokens/context/SelectedEscrowContext";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { MultiReleaseMilestone } from "@trustless-work/escrow";
import { BalanceProgressBar } from "@/components/tw-blocks/escrows/indicators/balance-progress/bar/BalanceProgress";
import { formatAddress } from "@/components/tw-blocks/helpers/format.helper";
import { CircleCheckBig } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

type InvestFormValues = {
  amount: number;
};

interface InvestDialogProps {
  tokenSaleContractId: string;
  triggerLabel?: string;
}

const DEFAULT_USDC_ADDRESS =
  "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA";

export function InvestDialog({
  tokenSaleContractId,
  triggerLabel = "Invest",
}: InvestDialogProps) {
  const { walletAddress } = useWalletContext();
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const selected = useSelectedEscrow();
  const queryClient = useQueryClient();

  const form = useForm<InvestFormValues>({
    defaultValues: { amount: 0 },
    mode: "onChange",
  });

  const onSubmit = async (values: InvestFormValues) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    if (!walletAddress) {
      setErrorMessage("Please connect your wallet to continue.");
      return;
    }
    if (!tokenSaleContractId) {
      setErrorMessage("Missing token sale contract id.");
      return;
    }
    if (!values.amount || values.amount <= 0) {
      setErrorMessage("Enter a valid amount greater than 0.");
      return;
    }

    setSubmitting(true);

    try {
      const tokenService = new TokenService();

      const payload: BuyTokenPayload = {
        tokenSaleContractId,
        usdcAddress: DEFAULT_USDC_ADDRESS,
        payerAddress: walletAddress,
        beneficiaryAddress: walletAddress,
        amount: values.amount,
      };

      const buyResponse = await tokenService.buyToken(payload);

      if (!buyResponse?.success || !buyResponse?.xdr) {
        throw new Error(
          buyResponse?.message ?? "Failed to build buy transaction.",
        );
      }

      const signedTxXdr = await signTransaction({
        unsignedTransaction: buyResponse.xdr,
        address: walletAddress,
      });

      const sender = new SendTransactionService();
      const submitResponse = await sender.sendTransaction({
        signedXdr: signedTxXdr,
      });

      if (submitResponse.status !== "SUCCESS") {
        throw new Error(
          submitResponse.message ?? "Transaction submission failed.",
        );
      }

      // Refresh the escrow balance using TanStack Query
      const balanceQueryKey = ["escrows", [selected.escrowId]] as const;
      const singleEscrowKey = ["escrow", selected.escrowId] as const;

      // Balance used by BalanceProgressBar
      await queryClient.invalidateQueries({ queryKey: balanceQueryKey });
      await queryClient.refetchQueries({ queryKey: balanceQueryKey });

      // Escrow details (per-card) used by the Carousel modal content
      await queryClient.invalidateQueries({ queryKey: singleEscrowKey });
      await queryClient.refetchQueries({ queryKey: singleEscrowKey });

      // Escrows list (bulk fetch) used by the Carousel (partial match)
      await queryClient.invalidateQueries({ queryKey: ["escrows-by-ids"] });
      await queryClient.refetchQueries({ queryKey: ["escrows-by-ids"] });

      setSuccessMessage("Your investment transaction was sent successfully.");
      form.reset({ amount: 0 });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unexpected error while processing your investment.";
      setErrorMessage(message);
    } finally {
      setSubmitting(false);
    }
  };

  const totalAmount = React.useMemo(() => {
    if (!selected.escrow || selected.escrow.type !== "multi-release") return 0;

    const milestones = selected.escrow.milestones as MultiReleaseMilestone[];

    return milestones.reduce((acc, milestone) => acc + milestone.amount, 0);
  }, [selected.escrow?.milestones]);

  const isSubmitDisabled =
    submitting ||
    !form.watch("amount") ||
    Number.isNaN(form.watch("amount")) ||
    form.watch("amount") <= 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <RainbowButton variant="outline">{triggerLabel}</RainbowButton>
      </DialogTrigger>
      <DialogContent
        className={`${successMessage ? "sm:max-w-4xl" : "sm:max-w-md"} max-h-[80vh] overflow-y-auto`}
      >
        {successMessage ? (
          <div className="w-full overflow-hidden p-4 md:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 p-4 md:p-6">
              {/* Left Column: Image */}
              <div className="flex items-center justify-center">
                {selected.imageSrc ? (
                  <img
                    className="max-h-80 w-auto transition duration-300 object-cover"
                    src={selected.imageSrc as string}
                    loading="lazy"
                    decoding="async"
                    alt={
                      selected.escrow?.title || "Background of a beautiful view"
                    }
                  />
                ) : (
                  <div className="w-full h-48 md:h-64 rounded-lg bg-muted flex items-center justify-center border border-border">
                    <span className="text-muted-foreground text-sm">
                      No image
                    </span>
                  </div>
                )}
              </div>

              {/* Right Column: Information */}
              <div className="flex flex-col justify-center space-y-4">
                <h2 className="flex items-center gap-2 text-xl md:text-2xl font-bold text-foreground">
                  <CircleCheckBig className="w-6 h-6 md:w-10 md:h-10 text-green-600 flex-shrink-0" />{" "}
                  Investment Successful!
                </h2>
                <p className="text-sm md:text-base text-muted-foreground line-clamp-3">
                  Your investment transaction was sent successfully.
                </p>

                {/* Title */}
                <div>
                  <h3 className="text-xl md:text-2xl font-bold text-foreground line-clamp-2">
                    {selected.escrow?.title || "No title"}
                  </h3>
                </div>

                {/* Description - Truncated */}
                {selected.escrow?.description && (
                  <div>
                    <p className="text-sm md:text-base text-muted-foreground line-clamp-3">
                      {selected.escrow?.description}
                    </p>
                  </div>
                )}

                {/* Amount and Balance */}
                <BalanceProgressBar
                  contractId={selected.escrowId ?? ""}
                  target={totalAmount ?? 0}
                  currency={selected.escrow?.trustline?.name ?? "USDC"}
                />

                {/* Metadata */}
                <div className="text-xs md:text-sm text-muted-foreground pt-2 border-t border-border">
                  <p>
                    <span className="font-bold">ID:</span>{" "}
                    {formatAddress(selected.escrowId)}
                  </p>

                  {selected.tokenSaleContractId && (
                    <p>
                      <span className="font-bold">Contract Sale:</span>{" "}
                      {formatAddress(selected.tokenSaleContractId)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <DialogHeader>
              <DialogTitle>Invest in Token Sale</DialogTitle>
              <DialogDescription>
                Enter the amount of USDC you want to invest. You will sign and
                submit the transaction with your wallet.
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form
                className="space-y-4"
                onSubmit={form.handleSubmit(onSubmit)}
              >
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount (USDC)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          inputMode="decimal"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          {...field}
                          value={
                            Number.isNaN(field.value as number) ||
                            field.value === ("" as unknown as number)
                              ? ""
                              : String(field.value)
                          }
                          onChange={(e) => {
                            const next =
                              e.target.value === ""
                                ? ("" as unknown as number)
                                : Number(e.target.value);
                            field.onChange(next);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {errorMessage ? (
                  <p className="text-sm text-destructive" role="alert">
                    {errorMessage}
                  </p>
                ) : null}

                <div className="flex justify-end gap-2">
                  <DialogClose asChild>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={submitting}
                    >
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button type="submit" disabled={isSubmitDisabled}>
                    {submitting ? "Processing..." : "Confirm"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
