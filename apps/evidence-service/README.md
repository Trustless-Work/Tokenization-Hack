# Evidence Service

A standalone microservice for uploading evidence documents to IPFS/Pinata. This service can be easily called and used by any application in the monorepo.

## Features

- Upload evidence documents (title, description, document file) to IPFS via Pinata
- Returns unique IPFS URL for each evidence record
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
  "ipfsUrl": "https://gateway.pinata.cloud/ipfs/Qm...",
  "title": "Evidence Title",
  "description": "Evidence Description",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

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
console.log("IPFS URL:", result.ipfsUrl);
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

console.log("IPFS URL:", response.data.ipfsUrl);
```

## Integration with Other Apps

This service can be called from any application in the monorepo. Simply make HTTP requests to the evidence service endpoint.

For example, in your Next.js apps, you can create a service file:

```typescript
// services/evidence.service.ts
import axios from "axios";

const EVIDENCE_SERVICE_URL = process.env.NEXT_PUBLIC_EVIDENCE_SERVICE_URL || "http://localhost:3001";

export async function uploadEvidence(
  title: string,
  description: string,
  document: File
) {
  const formData = new FormData();
  formData.append("title", title);
  formData.append("description", description);
  formData.append("document", document);

  const response = await axios.post(
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

