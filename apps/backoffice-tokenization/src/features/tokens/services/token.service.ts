import axios, { AxiosInstance } from "axios";

export type DeployTokenResponse = {
  success: boolean;
  tokenFactoryAddress: string;
  tokenSaleAddress: string;
};

export type DeployTokenParams = {
  escrowContractId: string;
  tokenName: string;
  tokenSymbol: string;
};

export class TokenService {
  private readonly apiUrl: string;
  private readonly axios: AxiosInstance;

  constructor() {
    // If NEXT_PUBLIC_API_URL is set, use it. Otherwise, use relative path /api
    // This allows the service to work both with external APIs and Next.js route handlers
    const envApiUrl = process.env.NEXT_PUBLIC_API_URL;
    this.apiUrl = envApiUrl && envApiUrl.trim() !== "" ? envApiUrl : "/api";
    
    this.axios = axios.create({
      baseURL: this.apiUrl,
    });
  }

  async deployToken(params: DeployTokenParams): Promise<DeployTokenResponse> {
    const response = await this.axios.post<DeployTokenResponse>("/deploy", {
      escrowContractId: params.escrowContractId,
      tokenName: params.tokenName,
      tokenSymbol: params.tokenSymbol,
    });

    return response.data;
  }
}
