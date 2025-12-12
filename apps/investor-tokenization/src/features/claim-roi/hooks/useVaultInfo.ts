// src/features/claim-roi/hooks/useVaultInfo.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { useWalletContext } from "@trustless-work/tw-blocks/wallet-kit/WalletProvider";
import { getVaultInfo } from "../services/vaultInfo.service";

export const useVaultInfo = (vaultContractId: string) => {
  // 🔥 Get the real wallet address from WalletContext
  const { walletAddress } = useWalletContext();

  return useQuery({
    queryKey: ["vault-info", vaultContractId, walletAddress],
    queryFn: () => getVaultInfo(vaultContractId, walletAddress!),
    enabled: !!walletAddress && !!vaultContractId,
  });
};
