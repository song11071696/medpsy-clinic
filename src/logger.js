/**
 * Performance Logger — Tracks TTFT, tokens/sec, model load times
 * Produces audit logs required for QVAC hackathon submission
 */
import fs from "fs";
import os from "os";

export class PerformanceLogger {
  constructor() {
    this.logs = {
      sessionId: new Date().toISOString(),
      device: {
        platform: process.platform,
        arch: process.arch,
        cpus: os.cpus().length,
        totalMemoryGB: (os.totalmem() / 1073741824).toFixed(1),
        freeMemoryGB: (os.freemem() / 1073741824).toFixed(1),
        nodeVersion: process.version,
      },
      modelLoads: [],
      inferences: [],
    };
  }

  logModelLoad(modelName, durationMs) {
    this.logs.modelLoads.push({ model: modelName, loadTimeMs: durationMs, timestamp: new Date().toISOString() });
  }

  logInference({ prompt, tokenCount, ttft, tokensPerSecond, totalTime }) {
    this.logs.inferences.push({
      prompt, tokenCount, ttftMs: ttft,
      tokensPerSecond: parseFloat(tokensPerSecond),
      totalTimeMs: totalTime, timestamp: new Date().toISOString(),
    });
  }

  saveToFile(filepath) {
    this.logs.summary = {
      totalInferences: this.logs.inferences.length,
      avgTTFT: this.logs.inferences.length > 0 ? (this.logs.inferences.reduce((s, i) => s + i.ttftMs, 0) / this.logs.inferences.length).toFixed(1) : 0,
      avgTokensPerSec: this.logs.inferences.length > 0 ? (this.logs.inferences.reduce((s, i) => s + i.tokensPerSecond, 0) / this.logs.inferences.length).toFixed(2) : 0,
    };
    fs.writeFileSync(filepath, JSON.stringify(this.logs, null, 2));
    console.log(`📊 Performance log saved to ${filepath}`);
  }
}
