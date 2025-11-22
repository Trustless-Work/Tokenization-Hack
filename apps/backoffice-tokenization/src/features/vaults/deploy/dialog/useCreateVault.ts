import * as React from "react";
import { useForm } from "react-hook-form";
import {
  VaultService,
  type DeployVaultResponse,
} from "@/features/vaults/services/vault.service";
import { useWalletContext } from "@/components/tw-blocks/wallet-kit/WalletProvider";

export type CreateVaultFormValues = {
  price: number;
};

type UseCreateVaultParams = {
  onSuccess?: (response: DeployVaultResponse) => void;
};

const USDC_ADDRESS = "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA";
const FACTORY_ADDRESS =
  "CD4NQKFMZTOJ23SQ2AYJGNXCCLPNJNSU4DZL6Y4Q77VLLG2TPOJEC42W";

export function useCreateVault(params?: UseCreateVaultParams) {
  const { walletAddress } = useWalletContext();

  const form = useForm<CreateVaultFormValues>({
    defaultValues: {
      price: 0,
    },
    mode: "onChange",
  });

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [response, setResponse] = React.useState<DeployVaultResponse | null>(
    null
  );

  const onSubmit = async (values: CreateVaultFormValues) => {
    setError(null);
    setIsSubmitting(true);

    try {
      const vaultService = new VaultService();
      const vaultResponse = await vaultService.deployVault({
        admin: walletAddress ?? "",
        enabled: false,
        price: values.price,
        token: FACTORY_ADDRESS,
        usdc: USDC_ADDRESS,
      });

      setResponse(vaultResponse);
      if (vaultResponse?.success) {
        params?.onSuccess?.(vaultResponse);
      } else {
        setError("Vault deployment did not succeed");
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
