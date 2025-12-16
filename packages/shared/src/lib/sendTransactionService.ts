import axios, { AxiosInstance } from "axios";

export type SendTransactionPayload = {
  signedXdr: string;
};

export type SendTransactionResponse = {
  status: string;
  message: string;
  hash?: string;
};

export type SendTransactionServiceOptions = {
  /**
   * When omitted:
   * - prefers NEXT_PUBLIC_API_URL (useful when calling an external API)
   * - falls back to "/api" (useful when using Next route handlers)
   */
  baseURL?: string;
};

export class SendTransactionService {
  private readonly axios: AxiosInstance;

  constructor(options: SendTransactionServiceOptions = {}) {
    const baseURL = options.baseURL ?? process.env.NEXT_PUBLIC_API_URL ?? "/api";

    this.axios = axios.create({
      baseURL,
    });
  }

  async sendTransaction(
    payload: SendTransactionPayload
  ): Promise<SendTransactionResponse> {
    const response = await this.axios.post<SendTransactionResponse>(
      "/helper/send-transaction",
      payload
    );

    return response.data;
  }
}


