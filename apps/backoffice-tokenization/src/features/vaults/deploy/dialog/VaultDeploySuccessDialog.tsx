import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { type DeployVaultResponse } from "@/features/vaults/services/vault.service";
import { CheckCircle } from "lucide-react";
import { useCopy } from "@trustless-work/tw-blocks/helpers/useCopy";
import Link from "next/link";

type VaultDeploySuccessDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  response: DeployVaultResponse | null;
};

export function VaultDeploySuccessDialog(props: VaultDeploySuccessDialogProps) {
  const { open, onOpenChange, response } = props;
  const { copiedKeyId, copyToClipboard } = useCopy();

  const address = response?.vaultContractAddress ?? "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full! sm:max-w-xl!">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-700" />
            Vault Deployment Successful
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="vaultAddress">Vault Contract Address</Label>
            <div className="flex gap-2">
              <Input
                id="vaultAddress"
                readOnly
                value={address}
                className="flex-1"
              />
              {address ? (
                <Button
                  type="button"
                  variant="outline"
                  className="cursor-pointer"
                  onClick={() => copyToClipboard(address)}
                >
                  {copiedKeyId ? "Copied!" : "Copy"}
                </Button>
              ) : null}
            </div>
            {address ? (
              <div>
                <Link
                  href={`https://stellar.expert/explorer/testnet/contract/${address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  View Transaction
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
