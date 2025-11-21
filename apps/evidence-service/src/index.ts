import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { evidenceRouter } from "./routes/evidence";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/evidence", evidenceRouter);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "evidence-service" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Evidence Service running on port ${PORT}`);
});

