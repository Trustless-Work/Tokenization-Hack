import * as React from "react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { useCreateVault } from "./useCreateVault";
import { useWatch } from "react-hook-form";
import { VaultDeploySuccessDialog } from "./VaultDeploySuccessDialog";

export const CreateVaultDialog = () => {
  const [open, setOpen] = React.useState(false);
  const [openSuccess, setOpenSuccess] = React.useState(false);

  const { form, isSubmitting, error, response, setResponse, handleSubmit } =
    useCreateVault({
      onSuccess: () => {
        setOpen(false);
        setOpenSuccess(true);
      },
    });

  // Realtime derived calculation: interpret input as percentage and show multiplier feedback
  const percentageRaw = useWatch({ control: form.control, name: "price" });
  const percentage = Number.isFinite(Number(percentageRaw))
    ? Number(percentageRaw)
    : 0;
  const multiplier = 1 + percentage / 100;
  const finalPricePerToken = multiplier; // assuming base price = 1

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" type="button" className="cursor-pointer">
            Create Vault
          </Button>
        </DialogTrigger>
        <DialogContent className="w-full! sm:max-w-lg! max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Vault</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={handleSubmit} className="flex flex-col space-y-6">
              <FormField
                control={form.control}
                name="price"
                rules={{ required: "Price is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      Price<span className="text-destructive ml-1">*</span>
                    </FormLabel>
                    <FormDescription>
                      The percentage you enter becomes a multiplier on the base
                      price. 6% → 1.06, 20% → 1.20. That multiplier is the final
                      price per token.
                    </FormDescription>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Enter price"
                        autoComplete="off"
                        {...field}
                      />
                    </FormControl>
                    <div className="text-xs text-muted-foreground mt-1">
                      Multiplier:{" "}
                      <span className="font-medium">
                        {Number.isFinite(multiplier)
                          ? multiplier.toFixed(4)
                          : "—"}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Price per token (base 1):{" "}
                      <span className="font-medium">
                        {Number.isFinite(finalPricePerToken)
                          ? finalPricePerToken.toFixed(4)
                          : "—"}
                      </span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="factoryAddress"
                rules={{ required: "Factory address is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      Factory Address
                      <span className="text-destructive ml-1">*</span>
                    </FormLabel>
                    <FormDescription>
                      The factory address of the token you want to deploy the
                      vault for.
                    </FormDescription>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="Enter factory address"
                        autoComplete="off"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                    <span className="ml-2">Creating...</span>
                  </div>
                ) : (
                  "Create Vault"
                )}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <VaultDeploySuccessDialog
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
