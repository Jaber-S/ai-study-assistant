import "dotenv/config";
import express from "express";
import cors from "cors";
import { createAiRouter } from "./routes/ai.js";

const app = express();
const PORT = Number(process.env.PORT) || 3007;
const DEFAULT_MODEL = "openrouter/auto";
const apiKey = process.env.OPENROUTER_API_KEY;

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || true,
  })
);
app.use(express.json({ limit: "15mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api", createAiRouter({ apiKey, model: DEFAULT_MODEL }));

const server = app.listen(PORT, () => {
  console.log(`AI Study Assistant API listening on http://localhost:${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(
      `Port ${PORT} is already in use. Set PORT to an available port or stop the running service.`
    );
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
});
