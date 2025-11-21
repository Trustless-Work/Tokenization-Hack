# Evidence Service

A standalone microservice for uploading evidence documents to IPFS/Pinata. This service can be easily called and used by any application in the monorepo.

## Features

- Upload evidence documents (title, description, document file) to IPFS via Pinata
- Returns both metadata URL (evidence record) and document URL (direct file access)
- Both document file and metadata JSON are stored on IPFS/Pinata
- Simple REST API interface
- CORS enabled for cross-origin requests

## API Endpoints

### POST `/api/evidence`

Upload an evidence document to IPFS.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body:
  - `title` (string, required): Title of the evidence
  - `description` (string, required): Description of the evidence
  - `document` (file, required): The document file to upload

**Response:**
```json
{
  "success": true,
  "metadataUrl": "https://gateway.pinata.cloud/ipfs/Qm...",
  "documentUrl": "https://gateway.pinata.cloud/ipfs/Qm...",
  "documentHash": "Qm...",
  "metadataHash": "Qm...",
  "title": "Evidence Title",
  "description": "Evidence Description",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Response Fields:**
- `metadataUrl`: Main evidence record (JSON containing title, description, timestamp, and document reference)
- `documentUrl`: Direct URL to access the uploaded document file
- `documentHash`: IPFS hash of the uploaded document
- `metadataHash`: IPFS hash of the metadata JSON record

### GET `/health`

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "service": "evidence-service"
}
```

## Environment Variables

Create a `.env` file in the root of this service (`apps/evidence-service/.env`):

```env
PORT=3001
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_KEY=your_pinata_secret_key
```

**Note:** The `.env` file is gitignored for security. Make sure to create it locally with your Pinata credentials. The service has been pre-configured with the provided API keys in the `.env` file (which is gitignored).

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

The service will run on `http://localhost:3001` (or the port specified in `.env`).

## Build

```bash
npm run build
```

## Production

```bash
npm start
```

## Usage Example

### Using curl:

```bash
curl -X POST http://localhost:3001/api/evidence \
  -F "title=Project Milestone 1" \
  -F "description=Completed initial development phase" \
  -F "document=@/path/to/document.pdf"
```

### Using JavaScript/TypeScript (fetch):

```typescript
const formData = new FormData();
formData.append("title", "Project Milestone 1");
formData.append("description", "Completed initial development phase");
formData.append("document", fileInput.files[0]);

const response = await fetch("http://localhost:3001/api/evidence", {
  method: "POST",
  body: formData,
});

const result = await response.json();
console.log("Metadata URL:", result.metadataUrl); // Evidence record with all info
console.log("Document URL:", result.documentUrl); // Direct access to document file
```

### Using axios:

```typescript
import axios from "axios";

const formData = new FormData();
formData.append("title", "Project Milestone 1");
formData.append("description", "Completed initial development phase");
formData.append("document", fileInput.files[0]);

const response = await axios.post(
  "http://localhost:3001/api/evidence",
  formData,
  {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  }
);

console.log("Metadata URL:", response.data.metadataUrl); // Evidence record with all info
console.log("Document URL:", response.data.documentUrl); // Direct access to document file
```

## Integration with Other Apps

This service can be called from any application in the monorepo. Simply make HTTP requests to the evidence service endpoint.

### Using the Example Client

Copy `src/services/evidenceClient.example.ts` to your app and use it:

```typescript
import { EvidenceService } from "./services/evidenceClient";

const evidenceService = new EvidenceService();

const result = await evidenceService.uploadEvidence({
  title: "Project Milestone 1",
  description: "Completed initial development phase",
  document: fileInput.files[0],
});

// Access the evidence record
console.log("Evidence Record:", result.metadataUrl);

// Access the document directly
console.log("Document File:", result.documentUrl);
```

### Custom Integration Example

For example, in your Next.js apps, you can create a service file:

```typescript
// services/evidence.service.ts
import axios from "axios";

const EVIDENCE_SERVICE_URL = process.env.NEXT_PUBLIC_EVIDENCE_SERVICE_URL || "http://localhost:3001";

export interface EvidenceUploadResult {
  success: boolean;
  metadataUrl: string; // Evidence record (JSON with all metadata + document reference)
  documentUrl: string; // Direct URL to the uploaded document file
  documentHash: string;
  metadataHash: string;
  title: string;
  description: string;
  timestamp: string;
}

export async function uploadEvidence(
  title: string,
  description: string,
  document: File
): Promise<EvidenceUploadResult> {
  const formData = new FormData();
  formData.append("title", title);
  formData.append("description", description);
  formData.append("document", document);

  const response = await axios.post<EvidenceUploadResult>(
    `${EVIDENCE_SERVICE_URL}/api/evidence`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
}
```

### Accessing Evidence Data

Once you have the URLs, you can fetch the evidence data:

```typescript
// Fetch the evidence record (metadata)
const metadataResponse = await fetch(result.metadataUrl);
const evidenceRecord = await metadataResponse.json();
// Contains: title, description, timestamp, document (with hash, name, type, size)

// Fetch the document file directly
const documentResponse = await fetch(result.documentUrl);
const documentBlob = await documentResponse.blob();
// Use the blob to display or download the document
```

