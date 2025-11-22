import axios, { AxiosInstance } from "axios";

export type ClaimROIPayload = {
  vaultContractId: string;
  beneficiaryAddress: string;
};

export type ClaimROIResponse = {
  success: boolean;
  xdr: string;
  message: string;
};

export class ClaimROIService {
  private readonly axios: AxiosInstance;

  constructor() {
    this.axios = axios.create({
      baseURL: "/api",
    });
  }

  async claimROI(payload: ClaimROIPayload): Promise<ClaimROIResponse> {
    const response = await this.axios.post<ClaimROIResponse>(
      "/vault-contract/claim",
      payload
    );

    return response.data;
  }
}
