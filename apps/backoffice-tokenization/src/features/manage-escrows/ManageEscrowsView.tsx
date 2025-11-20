"use client";

import { EscrowsBySignerCards } from "@/components/tw-blocks/escrows/escrows-by-signer/cards/EscrowsCards";
import { InitializeEscrowDialog } from "@/components/tw-blocks/escrows/multi-release/initialize-escrow/dialog/InitializeEscrow";

export const ManageEscrowsView = () => {
  return (
    <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
      <div className="container">
        <div className="flex w-full mb-4 justify-end">
          <div className="flex w-1/6">
            <InitializeEscrowDialog />
          </div>
        </div>

        <EscrowsBySignerCards />
      </div>
    </main>
  );
};
