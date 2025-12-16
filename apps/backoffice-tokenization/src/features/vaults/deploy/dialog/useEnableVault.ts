import * as React from "react";
import { useForm } from "react-hook-form";
import {
  VaultService,
  type EnableVaultResponse,
} from "@/features/vaults/services/vault.service";
import { useWalletContext } from "@tokenization/tw-blocks-shared/src/wallet-kit/WalletProvider";
import { signTransaction } from "@tokenization/tw-blocks-shared/src/wallet-kit/wallet-kit";
import { SendTransactionService } from "@/lib/sendTransactionService";
import { toastSuccessWithTx } from "@/lib/toastWithTx";

export type EnableVaultFormValues = {
  vaultContractAddress: string;
};

type UseEnableVaultParams = {
  onSuccess?: (response: EnableVaultResponse) => void;
};

export function useEnableVault(params?: UseEnableVaultParams) {
  const { walletAddress } = useWalletContext();

  const form = useForm<EnableVaultFormValues>({
    defaultValues: {
      vaultContractAddress: "",
    },
    mode: "onSubmit",
  });

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [response, setResponse] = React.useState<EnableVaultResponse | null>(
    null
  );

  const onSubmit = async (values: EnableVaultFormValues) => {
    setError(null);
    setIsSubmitting(true);
    try {
      const vaultService = new VaultService();
      const enableResponse = await vaultService.enableVault({
        vaultContractId: values.vaultContractAddress,
        adminAddress: walletAddress ?? "",
      });

      if (!enableResponse?.success || !enableResponse?.xdr) {
        throw new Error(
          enableResponse?.message ?? "Failed to build enable transaction."
        );
      }

      const signedTxXdr = await signTransaction({
        unsignedTransaction: enableResponse.xdr ?? "",
        address: walletAddress ?? "",
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

      toastSuccessWithTx("Vault enabled successfully", submitResponse.hash);

      setResponse(enableResponse);

      if (enableResponse?.success) {
        params?.onSuccess?.(enableResponse);
      } else {
        setError("Enable vault request did not succeed");
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unexpected error";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = form.handleSubmit(onSubmit);

  return {
    form,
    isSubmitting,
    error,
    response,
    setResponse,
    handleSubmit,
  };
}
