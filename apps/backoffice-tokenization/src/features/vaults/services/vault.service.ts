import axios, { AxiosInstance } from "axios";

export type DeployVaultResponse = {
  success: boolean;
  vaultContractAddress: string;
};

export type EnableVaultResponse = {
  message: string;
  success: boolean;
  xdr: string;
};

export type EnableVaultPayload = {
  vaultContractId: string;
  adminAddress: string;
};

export class VaultService {
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

  async deployVault({
    admin,
    enabled,
    price,
    token,
    usdc,
  }: {
    admin: string;
    enabled: boolean;
    price: number;
    token: string;
    usdc: string;
  }): Promise<DeployVaultResponse> {
    const response = await this.axios.post<DeployVaultResponse>(
      "/deploy/vault-contract",
      {
        admin,
        enabled,
        price,
        token,
        usdc,
      }
    );

    return response.data;
  }

  async enableVault({
    vaultContractId,
    adminAddress,
  }: EnableVaultPayload): Promise<EnableVaultResponse> {
    const response = await this.axios.post<EnableVaultResponse>(
      "/vault-contract/availability-for-exchange",
      {
        vaultContractId,
        adminAddress,
        enabled: true,
      }
    );

    return response.data;
  }
}
