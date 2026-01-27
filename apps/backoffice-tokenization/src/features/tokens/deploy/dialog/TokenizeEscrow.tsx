import * as React from "react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@tokenization/ui/form";
import { Input } from "@tokenization/ui/input";
import { Button } from "@tokenization/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@tokenization/ui/dialog";
import { Loader2 } from "lucide-react";
import { TokenizeEscrowSuccessDialog } from "./TokenizeEscrowSuccessDialog";
import { useTokenizeEscrow } from "./useTokenizeEscrow";

export const TokenizeEscrowDialog = () => {
  const [open, setOpen] = React.useState(false);
  const [openSuccess, setOpenSuccess] = React.useState(false);

  const { form, isSubmitting, error, response, setResponse, handleSubmit } =
    useTokenizeEscrow({
      onSuccess: () => {
        setOpen(false);
        setOpenSuccess(true);
      },
    });

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" type="button" className="cursor-pointer">
            Tokenize Escrow
          </Button>
        </DialogTrigger>
        <DialogContent className="!w-full sm:!max-w-lg max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tokenize Escrow</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={handleSubmit} className="flex flex-col space-y-6">
              <FormField
                control={form.control}
                name="escrowId"
                rules={{ required: "Escrow ID is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      Escrow ID<span className="text-destructive ml-1">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter escrow contract ID"
                        autoComplete="off"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tokenName"
                rules={{ required: "Token name is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      Token Name<span className="text-destructive ml-1">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Trustless Work Token"
                        autoComplete="off"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tokenSymbol"
                rules={{ 
                  required: "Token symbol is required",
                  maxLength: {
                    value: 12,
                    message: "Symbol must be 12 characters or less"
                  },
                  pattern: {
                    value: /^[A-Z0-9]+$/,
                    message: "Symbol must contain only uppercase letters and numbers"
                  }
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      Token Symbol/Ticker<span className="text-destructive ml-1">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., TRUST"
                        autoComplete="off"
                        maxLength={12}
                        {...field}
                        onChange={(e) => {
                          // Convert to uppercase automatically
                          field.onChange(e.target.value.toUpperCase());
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Maximum 12 characters. Uppercase letters and numbers only.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="rounded-lg border bg-muted/50 p-4">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> This token represents Escrow{" "}
                  <span className="font-mono text-xs">
                    {form.watch("escrowId") || "[Escrow ID]"}
                  </span>{" "}
                  and can only be minted by its Token Sale contract.
                </p>
              </div>

              {error ? (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              ) : null}

              <Button
                className="w-full cursor-pointer"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="ml-2">Deploying...</span>
                  </div>
                ) : (
                  "Deploy Token"
                )}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <TokenizeEscrowSuccessDialog
        open={openSuccess}
        onOpenChange={(nextOpen) => {
          setOpenSuccess(nextOpen);
          if (!nextOpen) {
            setResponse(null);
          }
        }}
        response={response}
      />
    </>
  );
};
