import * as React from "react";
import { useForm } from "react-hook-form";
import {
  TokenService,
  type DeployTokenResponse,
} from "@/features/tokens/services/token.service";

export type TokenizeEscrowFormValues = {
  escrowId: string;
};

type UseTokenizeEscrowParams = {
  onSuccess?: (response: DeployTokenResponse) => void;
};

export function useTokenizeEscrow(params?: UseTokenizeEscrowParams) {
  const form = useForm<TokenizeEscrowFormValues>({
    defaultValues: {
      escrowId: "",
    },
    mode: "onSubmit",
  });

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [response, setResponse] = React.useState<DeployTokenResponse | null>(
    null
  );

  const onSubmit = async (values: TokenizeEscrowFormValues) => {
    setError(null);
    setIsSubmitting(true);
    try {
      const tokenService = new TokenService();
      const tokenResponse = await tokenService.deployToken(values.escrowId);
      setResponse(tokenResponse);
      params?.onSuccess?.(tokenResponse);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unexpected error";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = form.handleSubmit(onSubmit);

  return {
    form,
    isSubmitting,
    error,
    response,
    setResponse,
    handleSubmit,
  };
}
