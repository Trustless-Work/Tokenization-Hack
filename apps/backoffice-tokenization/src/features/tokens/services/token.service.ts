import axios, { AxiosInstance } from "axios";

export type DeployTokenResponse = {
  success: boolean;
  tokenFactoryAddress: string;
  tokenSaleAddress: string;
};

export class TokenService {
  private readonly apiUrl = process.env.NEXT_PUBLIC_API_URL;
  private readonly axios: AxiosInstance;

  constructor() {
    this.axios = axios.create({
      baseURL: this.apiUrl,
    });
  }

  async deployToken(escrowContractId: string): Promise<DeployTokenResponse> {
    const response = await this.axios.post<DeployTokenResponse>("/deploy", {
      escrowContractId,
    });

    return response.data;
  }
}
