/**
 * Example client service for calling the Evidence Service
 * 
 * This file demonstrates how to integrate the Evidence Service
 * into other applications in the monorepo.
 * 
 */

// Example client service using fetch (no dependencies required)
// If you prefer axios, install it: npm install axios

export interface UploadEvidenceParams {
  title: string;
  description: string;
  document: File;
}

export interface UploadEvidenceResponse {
  success: boolean;
  ipfsUrl: string;
  title: string;
  description: string;
  timestamp: string;
}

export class EvidenceService {
  private readonly apiUrl: string;

  constructor(apiUrl?: string) {
    // Use environment variable or default to localhost
    this.apiUrl = apiUrl || process.env.NEXT_PUBLIC_EVIDENCE_SERVICE_URL || "http://localhost:3001";
  }

  /**
   * Upload evidence document to IPFS
   */
  async uploadEvidence({
    title,
    description,
    document,
  }: UploadEvidenceParams): Promise<UploadEvidenceResponse> {
    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("document", document);

    const response = await fetch(`${this.apiUrl}/api/evidence`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
      const errorMessage = 
        typeof errorData === "object" && errorData !== null && "error" in errorData
          ? String(errorData.error)
          : `HTTP error! status: ${response.status}`;
      throw new Error(errorMessage);
    }

    const data = await response.json() as UploadEvidenceResponse;
    return data;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; service: string }> {
    const response = await fetch(`${this.apiUrl}/health`);
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }
    return response.json() as Promise<{ status: string; service: string }>;
  }
}

// Example usage:
// const evidenceService = new EvidenceService();
// const result = await evidenceService.uploadEvidence({
//   title: "Project Milestone 1",
//   description: "Completed initial development phase",
//   document: fileInput.files[0],
// });
// console.log("IPFS URL:", result.ipfsUrl);

