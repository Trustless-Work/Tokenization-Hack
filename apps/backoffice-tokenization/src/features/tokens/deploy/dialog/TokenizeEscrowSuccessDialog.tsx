import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { type DeployTokenResponse } from "@/features/tokens/services/token.service";
import { CheckCircle } from "lucide-react";
import { useCopy } from "@trustless-work/tw-blocks/helpers/useCopy";
import Link from "next/link";

type TokenizeEscrowSuccessDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  response: DeployTokenResponse | null;
};

export function TokenizeEscrowSuccessDialog(
  props: TokenizeEscrowSuccessDialogProps
) {
  const { open, onOpenChange, response } = props;

  const { copiedKeyId, copyToClipboard } = useCopy();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full! sm:max-w-xl!">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-700" />
            Token Deployment Successful
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="tokenFactoryAddress">Token Factory Address</Label>
            <div className="flex gap-2">
              <Input
                id="tokenFactoryAddress"
                readOnly
                value={response?.tokenFactoryAddress ?? ""}
                className="flex-1"
              />
              {response?.tokenFactoryAddress ? (
                <Button
                  type="button"
                  variant="outline"
                  className="cursor-pointer"
                  onClick={() => copyToClipboard(response.tokenFactoryAddress)}
                >
                  {copiedKeyId ? "Copied!" : "Copy"}
                </Button>
              ) : null}
            </div>
            {response?.tokenFactoryAddress ? (
              <div>
                <Link
                  href={`https://stellar.expert/explorer/testnet/contract/${response.tokenFactoryAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  View Transaction
                </Link>
              </div>
            ) : null}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="tokenSaleAddress">Token Sale Address</Label>
            <div className="flex gap-2">
              <Input
                id="tokenSaleAddress"
                readOnly
                value={response?.tokenSaleAddress ?? ""}
                className="flex-1"
              />
              {response?.tokenSaleAddress ? (
                <Button
                  type="button"
                  variant="outline"
                  className="cursor-pointer"
                  onClick={() => copyToClipboard(response.tokenSaleAddress)}
                >
                  {copiedKeyId ? "Copied!" : "Copy"}
                </Button>
              ) : null}
            </div>
            {response?.tokenSaleAddress ? (
              <div>
                <Link
                  href={`https://stellar.expert/explorer/testnet/contract/${response.tokenSaleAddress}`}
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
