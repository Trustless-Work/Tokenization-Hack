import { Readable } from "stream";
import dotenv from "dotenv";

// Pinata SDK is a CommonJS module, use require for proper typing
const pinataSDK = require("@pinata/sdk");

dotenv.config();

interface UploadEvidenceParams {
  title: string;
  description: string;
  document: Express.Multer.File;
}

export interface EvidenceUploadResult {
  metadataUrl: string;
  documentUrl: string;
  documentHash: string;
  metadataHash: string;
}

/**
 * Convert buffer to readable stream
 */
function bufferToStream(buffer: Buffer): Readable {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

/**
 * Upload evidence document to Pinata/IPFS
 * Returns both the metadata URL (main evidence record) and document URL
 */
export async function uploadEvidence({
  title,
  description,
  document,
}: UploadEvidenceParams): Promise<EvidenceUploadResult> {
  const pinataApiKey = process.env.PINATA_API_KEY;
  const pinataSecretKey = process.env.PINATA_SECRET_KEY;

  if (!pinataApiKey || !pinataSecretKey) {
    throw new Error(
      "Pinata credentials not configured. Please set PINATA_API_KEY and PINATA_SECRET_KEY"
    );
  }

  try {
    // Initialize Pinata SDK - v2 is a class, must use 'new'
    const pinata = new pinataSDK(pinataApiKey, pinataSecretKey);

    // Create metadata JSON
    const metadata = {
      title,
      description,
      timestamp: new Date().toISOString(),
      documentName: document.originalname || "document",
      documentType: document.mimetype || "application/octet-stream",
      documentSize: document.size,
    };

    // Upload file to Pinata
    const fileStream = bufferToStream(document.buffer);
    const fileOptions = {
      pinataMetadata: {
        name: `evidence-${title}-${Date.now()}`,
        keyvalues: {
          title: title,
          description: description,
          timestamp: metadata.timestamp,
        } as Record<string, string | number | null>,
      },
    };

    const fileUpload = await pinata.pinFileToIPFS(fileStream, fileOptions);

    // Create a JSON document with metadata and reference to the file
    const evidenceDocument = {
      title,
      description,
      timestamp: metadata.timestamp,
      document: {
        ipfsHash: fileUpload.IpfsHash,
        name: document.originalname || "document",
        type: document.mimetype || "application/octet-stream",
        size: document.size,
      },
    };

    // Upload the JSON metadata document
    const jsonBuffer = Buffer.from(JSON.stringify(evidenceDocument, null, 2));
    const jsonStream = bufferToStream(jsonBuffer);
    const jsonOptions = {
      pinataMetadata: {
        name: `evidence-metadata-${title}-${Date.now()}`,
        keyvalues: {
          title: title,
          type: "evidence",
        } as Record<string, string | number | null>,
      },
    };

    const jsonUpload = await pinata.pinFileToIPFS(jsonStream, jsonOptions);

    // Return both URLs - metadata (main evidence record) and document
    const metadataUrl = `https://gateway.pinata.cloud/ipfs/${jsonUpload.IpfsHash}`;
    const documentUrl = `https://gateway.pinata.cloud/ipfs/${fileUpload.IpfsHash}`;

    return {
      metadataUrl, // Main evidence record with all metadata + document reference
      documentUrl, // Direct URL to the uploaded document file
      documentHash: fileUpload.IpfsHash,
      metadataHash: jsonUpload.IpfsHash,
    };
  } catch (error) {
    console.error("Pinata upload error:", error);
    throw new Error(
      `Failed to upload evidence to IPFS: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

