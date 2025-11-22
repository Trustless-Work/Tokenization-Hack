import axios, { AxiosInstance } from "axios";

export type BuyTokenPayload = {
  tokenSaleContractId: string;
  usdcAddress: string;
  payerAddress: string;
  beneficiaryAddress: string;
  amount: number;
};

export type DeployTokenResponse = {
  success: boolean;
  xdr: string;
  message: string;
};

export class TokenService {
  private readonly axios: AxiosInstance;

  constructor() {
    this.axios = axios.create({
      baseURL: "/api",
    });
  }

  async buyToken(payload: BuyTokenPayload): Promise<DeployTokenResponse> {
    const response = await this.axios.post<DeployTokenResponse>(
      "/token-sale/buy",
      payload,
    );

    return response.data;
  }
}
