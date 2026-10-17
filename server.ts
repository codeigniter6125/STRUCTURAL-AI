import express, { Request, Response } from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import analyzeHandler from "./api/analyze";
import analyzeInspectionHandler from "./api/analyze-inspection";
import geminiFallbackHandler from "./api/gemini-fallback";
import roboflowTestHandler from "./api/roboflow/test";
import roboflowProxyHandler from "./api/roboflow/proxy";
import generateReportHandler from "./api/generate-report";
import telemetryHandler from "./api/telemetry";
import healthHandler from "./api/health";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for JSON parsing with 50mb limit for high-res structural imagery
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // API Routes (Mounted first)
  app.get("/api/health", (req: Request, res: Response) => healthHandler(req, res));
  app.post("/api/analyze", (req: Request, res: Response) => analyzeHandler(req, res));
  app.post("/api/analyze-inspection", (req: Request, res: Response) => analyzeInspectionHandler(req, res));
  app.post("/api/gemini-fallback", (req: Request, res: Response) => geminiFallbackHandler(req, res));
  app.post("/api/roboflow/test", (req: Request, res: Response) => roboflowTestHandler(req, res));
  app.post("/api/roboflow/proxy", (req: Request, res: Response) => roboflowProxyHandler(req, res));
  app.post("/api/generate-report", (req: Request, res: Response) => generateReportHandler(req, res));
  app.get("/api/telemetry", (req: Request, res: Response) => telemetryHandler(req, res));
  app.post("/api/telemetry", (req: Request, res: Response) => telemetryHandler(req, res));

  // In development, hook into Vite development server
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: "0.0.0.0", port: PORT },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve static assets built into dist
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`StructuralAI Server running on http://0.0.0.0:${PORT}`);
    console.log(`Roboflow Workflow: https://serverless.roboflow.com/kumar-ritovash/workflows/building-infrastructure-defects-logic`);
    console.log(`Gemini Reporting Engine: ${process.env.GEMINI_API_KEY ? "CONFIGURED (Live)" : "STANDALONE DETERMINISTIC"}`);
  });
}

startServer().catch((err) => {
  console.error("Fatal error during server startup:", err);
  process.exit(1);
});
