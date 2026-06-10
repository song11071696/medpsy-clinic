/** @deprecated 此文件已废弃，请使用 api-server.js 作为唯一API入口。 */
console.warn('[DEPRECATED] src/api-server.js is deprecated. Use api-server.js instead.');
/**
 * OpenAI-compatible HTTP API server
 * Wraps QVAC SDK inference in a standard REST API
 */
import { loadModel, completion, unloadModel } from "@qvac/sdk";
import http from "http";

const PORT = process.env.PORT || 8080;

const ALLOWED_ORIGINS = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:3000', 'http://localhost:5173'];

async function startServer() {
  console.log("🏥 MedPsy Clinic API Server starting...");
  const modelId = await loadModel({
    modelSrc: "https://huggingface.co/qvac/MedPsy-4B/resolve/main/MedPsy-4B-Q4_K_M.gguf",
    modelType: "llm", contextSize: 4096,
  });
  console.log("✅ Model loaded. Starting HTTP server...");

  const server = http.createServer(async (req, res) => {
    const origin = req.headers.origin;
    if (ALLOWED_ORIGINS.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    }
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Vary", "Origin");
    if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }

    if (req.url === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok", model: "MedPsy-4B", engine: "qvac-sdk" }));
      return;
    }

    if (req.url === "/v1/chat/completions" && req.method === "POST") {
      // 安全修复：添加请求体大小限制，防止内存耗尽攻击
      let body = "";
      const MAX_BODY_SIZE = 1024 * 1024; // 1MB
      req.on("data", (chunk) => {
        body += chunk;
        if (body.length > MAX_BODY_SIZE) {
          res.writeHead(413, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Request body too large" }));
          req.destroy();
        }
      });
      req.on("end", async () => {
        try {
          const { messages, stream = false } = JSON.parse(body);
          if (stream) {
            res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" });
            const result = completion({ modelId, history: messages, stream: true });
            for await (const token of result.tokenStream) {
              res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: token } }] })}\n\n`);
            }
            res.write("data: [DONE]\n\n"); res.end();
          } else {
            const result = completion({ modelId, history: messages, stream: false });
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ choices: [{ message: { role: "assistant", content: result.text } }], model: "MedPsy-4B" }));
          }
        } catch (e) { res.writeHead(500, { "Content-Type": "application/json" }); res.end(JSON.stringify({ error: e.message })); }
      });
      return;
    }

    if (req.url === "/v1/models") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ data: [{ id: "MedPsy-4B", object: "model", owned_by: "qvac" }] }));
      return;
    }
    res.writeHead(404); res.end("Not Found");
  });

  server.listen(PORT, () => {
    console.log(`🚀 API server running on http://localhost:${PORT}`);
    console.log("   POST /v1/chat/completions — Chat (OpenAI-compatible)");
    console.log("   GET  /v1/models — List models");
    console.log("   GET  /health — Health check");
  });
}
startServer().catch(console.error);
