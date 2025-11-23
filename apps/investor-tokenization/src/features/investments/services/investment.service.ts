import axios, { AxiosInstance } from "axios";

export type TokenBalancePayload = {
  tokenFactoryAddress: string;
  address: string;
};

export type TokenBalanceResponse = {
  success: boolean;
  balance: string;
  error?: string;
};

export type TokenMetadataPayload = {
  tokenFactoryAddress: string;
};

export type TokenMetadataResponse = {
  success: boolean;
  name: string;
  symbol: string;
  decimals: number;
  error?: string;
};

export class InvestmentService {
  private readonly axios: AxiosInstance;

  constructor() {
    this.axios = axios.create({
      baseURL: "/api",
    });
  }

  async getTokenBalance(
    payload: TokenBalancePayload,
  ): Promise<TokenBalanceResponse> {
    const response = await this.axios.post<TokenBalanceResponse>(
      "/token-balance",
      payload,
    );

    return response.data;
  }

  async getTokenMetadata(
    payload: TokenMetadataPayload,
  ): Promise<TokenMetadataResponse> {
    const response = await this.axios.post<TokenMetadataResponse>(
      "/token-metadata",
      payload,
    );

    return response.data;
  }
}


