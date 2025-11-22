import * as React from "react";
import {
  Form,
  FormControl,
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
import { useEnableVault } from "./useEnableVault";
import { toast } from "sonner";

export const EnableVaultDialog = () => {
  const [open, setOpen] = React.useState(false);

  const { form, isSubmitting, error, response, setResponse, handleSubmit } =
    useEnableVault({
      onSuccess: () => {
        setOpen(false);
        toast.success("Vault enabled successfully");
      },
    });

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" type="button" className="cursor-pointer">
            Enable Vault
          </Button>
        </DialogTrigger>
        <DialogContent className="!w-full sm:!max-w-lg max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Enable Vault</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={handleSubmit} className="flex flex-col space-y-6">
              <FormField
                control={form.control}
                name="vaultContractAddress"
                rules={{ required: "Vault contract address is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      Vault Contract Address
                      <span className="text-destructive ml-1">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter vault contract ID (C...)"
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
                    <span className="ml-2">Enabling...</span>
                  </div>
                ) : (
                  "Enable"
                )}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
};


