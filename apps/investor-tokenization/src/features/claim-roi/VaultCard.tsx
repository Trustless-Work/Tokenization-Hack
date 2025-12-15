// src/features/claim-roi/VaultCard.tsx
"use client";

import { Card } from "@/components/ui/apple-cards-carousel";
import { useVaultInfo } from "./hooks/useVaultInfo";

export type VaultCardProps = {
  vault: {
    escrowId: string;
    tokenSale: string;
    vaultContractId: string;
    src: string;
    content?: React.ReactNode;
  };
  index: number;
};

export default function VaultCard({ vault, index }: VaultCardProps) {
  const { vaultContractId, src } = vault;
  const { data, isLoading } = useVaultInfo(vaultContractId);

  return (
    <Card
      card={{
        ...vault,
        content: (
          <div className="flex flex-col gap-4 p-4">
            <img
              src={src}
              alt=""
              className="rounded-md w-full h-48 object-cover"
            />

            {isLoading ? (
              <p className="text-sm text-muted-foreground">
                Loading vault information...
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                <div>
                  <h3 className="text-xl font-semibold">Vault Balance</h3>
                  <p className="text-lg font-bold">
                    {data?.vaultUsdcBalance ?? 0} USDC
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold">Your Token Balance</h3>
                  <p className="text-lg font-bold">
                    {data?.userTokenBalance ?? 0} Tokens
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold">Your Claimable ROI</h3>
                  <p className="text-lg font-bold">
                    {data?.claimableRoi ?? 0} USDC
                  </p>
                </div>
              </div>
            )}

            <button
              disabled={!data || data.claimableRoi <= 0}
              className="mt-4 bg-black text-white px-4 py-2 rounded-md disabled:opacity-40"
            >
              Claim ROI
            </button>
          </div>
        ),
      }}
      index={index}
    />
  );
}
