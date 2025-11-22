import axios, { AxiosInstance } from "axios";

export type SendTransactionPayload = {
  signedXdr: string;
};

export type SendTransactionResponse = {
  status: string;
  message: string;
  hash?: string;
};

export class SendTransactionService {
  private readonly axios: AxiosInstance;
  private readonly apiUrl = process.env.NEXT_PUBLIC_API_URL;

  constructor() {
    this.axios = axios.create({
      baseURL: this.apiUrl,
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
