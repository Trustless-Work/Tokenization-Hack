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
    null
  );
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const selected = useSelectedEscrow();

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
          buyResponse?.message ?? "Failed to build buy transaction."
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
          submitResponse.message ?? "Transaction submission failed."
        );
      }

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
      <DialogContent className="sm:max-w-md">
        {successMessage ? (
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-green-600 dark:text-green-400">
                Success
              </DialogTitle>
              <DialogDescription className="text-foreground">
                {successMessage}
              </DialogDescription>
            </DialogHeader>

            {selected?.imageSrc ? (
              <img
                src={selected.imageSrc}
                alt={selected.escrow?.title}
                className="w-full h-48 object-cover rounded-xl border border-border"
                loading="lazy"
                decoding="async"
              />
            ) : null}

            <div className="space-y-1">
              <p className="text-lg font-semibold text-foreground">
                {selected.escrow?.title ?? "Selected Escrow"}
              </p>
              <p className="text-sm text-muted-foreground whitespace-pre-line break-words">
                {selected.escrow?.description ?? ""}
              </p>
            </div>

            <div className="flex justify-end">
              <DialogClose asChild>
                <Button variant="default" onClick={() => setOpen(false)}>
                  Close
                </Button>
              </DialogClose>
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
