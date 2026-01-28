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
  private readonly baseURL: string;

  constructor(options: SendTransactionServiceOptions = {}) {
    // If NEXT_PUBLIC_API_URL is set, use it. Otherwise, use relative path /api
    // This allows the service to work both with external APIs and Next.js route handlers
    const envApiUrl = process.env.NEXT_PUBLIC_API_URL;
    this.baseURL = options.baseURL ?? (envApiUrl && envApiUrl.trim() !== "" ? envApiUrl : "/api");

    this.axios = axios.create({
      baseURL: this.baseURL,
    });
  }

  async sendTransaction(
    payload: SendTransactionPayload
  ): Promise<SendTransactionResponse> {
    // Log for debugging
    console.log("SendTransactionService: baseURL =", this.baseURL);
    console.log("SendTransactionService: full URL will be", `${this.baseURL}/helper/send-transaction`);
    
    const response = await this.axios.post<SendTransactionResponse>(
      "/helper/send-transaction",
      payload
    );

    return response.data;
  }
}


