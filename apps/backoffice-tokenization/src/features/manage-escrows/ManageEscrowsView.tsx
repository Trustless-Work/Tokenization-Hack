"use client";

import { EscrowsBySignerCards } from "@tokenization/tw-blocks-shared/src/escrows/escrows-by-signer/cards/EscrowsCards";
import { InitializeEscrowDialog } from "@tokenization/tw-blocks-shared/src/escrows/multi-release/initialize-escrow/dialog/InitializeEscrow";
import { TokenizeEscrowDialog } from "@/features/tokens/deploy/dialog/TokenizeEscrow";
import { CreateVaultDialog } from "../vaults/deploy/dialog/CreateVault";
import { EnableVaultDialog } from "../vaults/deploy/dialog/EnableVault";

export const ManageEscrowsView = () => {
  return (
    <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
      <div className="container">
        <div className="flex w-full mb-4 mt-8 gap-4">
          <TokenizeEscrowDialog />

          <CreateVaultDialog />

          <EnableVaultDialog />

          <div className="ml-auto">
            <InitializeEscrowDialog />
          </div>
        </div>

        <EscrowsBySignerCards />
      </div>
    </main>
  );
};
