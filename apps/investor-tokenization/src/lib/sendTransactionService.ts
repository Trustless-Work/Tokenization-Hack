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

  constructor() {
    this.axios = axios.create({
      baseURL: "/api",
    });
  }

  async sendTransaction(
    payload: SendTransactionPayload,
  ): Promise<SendTransactionResponse> {
    const response = await this.axios.post<SendTransactionResponse>(
      "/helper/send-transaction",
      payload,
    );

    return response.data;
  }
}
