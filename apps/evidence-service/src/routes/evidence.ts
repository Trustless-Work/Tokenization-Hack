import { Router } from "express";
import multer from "multer";
import { uploadEvidence } from "../services/pinataService";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * POST /api/evidence
 * Upload evidence document to IPFS/Pinata
 * 
 * Body (multipart/form-data):
 * - title: string
 * - description: string
 * - document: File
 */
router.post("/", upload.single("document"), async (req, res) => {
  try {
    const { title, description } = req.body;
    const file = req.file;

    // Validate required fields
    if (!title || !description) {
      return res.status(400).json({
        error: "Missing required fields",
        details: "Both 'title' and 'description' are required",
      });
    }

    if (!file) {
      return res.status(400).json({
        error: "Missing document",
        details: "A document file is required",
      });
    }

    // Upload to Pinata/IPFS
    const result = await uploadEvidence({
      title,
      description,
      document: file,
    });

    res.json({
      success: true,
      metadataUrl: result.metadataUrl, // Main evidence record (contains all data)
      documentUrl: result.documentUrl, // Direct URL to the document file
      documentHash: result.documentHash,
      metadataHash: result.metadataHash,
      title,
      description,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error uploading evidence:", error);
    res.status(500).json({
      error: "Internal Server Error",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

export { router as evidenceRouter };

