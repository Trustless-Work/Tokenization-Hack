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

type TokenizeEscrowSuccessDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  response: DeployTokenResponse | null;
};

export function TokenizeEscrowSuccessDialog(
  props: TokenizeEscrowSuccessDialogProps
) {
  const { open, onOpenChange, response } = props;

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* no-op */
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!w-full sm:!max-w-xl">
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
                  onClick={() => handleCopy(response.tokenFactoryAddress)}
                >
                  Copy
                </Button>
              ) : null}
            </div>
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
                  onClick={() => handleCopy(response.tokenSaleAddress)}
                >
                  Copy
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
