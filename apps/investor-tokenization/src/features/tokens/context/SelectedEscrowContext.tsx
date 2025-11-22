"use client";

import React, { createContext, useContext } from "react";
import { GetEscrowsFromIndexerResponse as Escrow } from "@trustless-work/escrow/types";

export type SelectedEscrowValue = {
  escrow: Escrow | undefined;
  escrowId: string;
  tokenSaleContractId?: string;
  imageSrc?: string;
};

const SelectedEscrowContext = createContext<SelectedEscrowValue | undefined>(
  undefined,
);

export function SelectedEscrowProvider({
  value,
  children,
}: {
  value: SelectedEscrowValue;
  children: React.ReactNode;
}) {
  return (
    <SelectedEscrowContext.Provider value={value}>
      {children}
    </SelectedEscrowContext.Provider>
  );
}

export function useSelectedEscrow(): SelectedEscrowValue {
  const ctx = useContext(SelectedEscrowContext);
  if (!ctx) {
    throw new Error(
      "useSelectedEscrow must be used within SelectedEscrowProvider",
    );
  }
  return ctx;
}
