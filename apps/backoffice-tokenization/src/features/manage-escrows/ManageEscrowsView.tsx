"use client";

import { EscrowsBySignerCards } from "@/components/tw-blocks/escrows/escrows-by-signer/cards/EscrowsCards";
import { InitializeEscrowDialog } from "@/components/tw-blocks/escrows/multi-release/initialize-escrow/dialog/InitializeEscrow";
import { TokenizeEscrowDialog } from "@/features/tokens/deploy/dialog/TokenizeEscrow";

export const ManageEscrowsView = () => {
  return (
    <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
      <div className="container">
        <div className="flex w-full mb-4 mt-8">
          <div className="flex gap-4">
            <InitializeEscrowDialog />

            <TokenizeEscrowDialog />
          </div>
        </div>

        <EscrowsBySignerCards />
      </div>
    </main>
  );
};
