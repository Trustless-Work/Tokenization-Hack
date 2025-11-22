import React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const EXPLORER_BASE = "https://stellar.expert/explorer/testnet";

export function toastSuccessWithTx(message: string, txHash?: string) {
  const href = txHash ? `${EXPLORER_BASE}/tx/${txHash}` : EXPLORER_BASE;

  toast.custom(
    () => (
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm">{message}</span>
        <Link href={href} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm">
            View Transaction
          </Button>
        </Link>
      </div>
    ),
    { duration: 5000 }
  );
}
