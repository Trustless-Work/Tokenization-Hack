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
  private readonly apiUrl = process.env.NEXT_PUBLIC_API_URL;
  private readonly axios: AxiosInstance;

  constructor() {
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
