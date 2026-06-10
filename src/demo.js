/**
 * Demo script — Predefined conversation for video recording
 * Runs 5 mental health scenarios to showcase MedPsy Clinic capabilities
 * Generates performance-log.json with TTFT and tokens/sec metrics
 */
import { loadModel, completion, unloadModel } from "@qvac/sdk";
import { initRAG, queryRAG } from "./rag.js";
import { PerformanceLogger } from "./logger.js";

const DEMO_QUESTIONS = [
  "I've been feeling really anxious about work lately. I can't sleep and my heart races.",
  "Sometimes I feel like nothing matters. What should I do?",
  "Can you help me understand what cognitive behavioral therapy is?",
  "I had a panic attack yesterday. How can I prevent the next one?",
  "What are some mindfulness exercises I can do right now?",
];

const SYSTEM_PROMPT = `You are MedPsy Clinic, a compassionate on-device AI mental health assistant.
Provide evidence-based psychological support using CBT and mindfulness.
Be concise but empathetic. Keep responses under 150 words.`;

async function runDemo() {
  const logger = new PerformanceLogger();
  console.log("=== MedPsy Clinic === DEMO MODE\n");

  // Load model
  console.log("[1/2] Loading MedPsy-4B model...");
  const loadStart = Date.now();
  const modelId = await loadModel({
    modelSrc: "https://huggingface.co/qvac/MedPsy-4B/resolve/main/MedPsy-4B-Q4_K_M.gguf",
    modelType: "llm",
    contextSize: 4096,
    onProgress: (p) => { if (p % 25 === 0) console.log(`   Loading: ${p}%`); },
  });
  logger.logModelLoad("MedPsy-4B-Q4_K_M", Date.now() - loadStart);
  console.log(`Model loaded in ${((Date.now() - loadStart) / 1000).toFixed(1)}s\n`);

  // Init RAG
  console.log("[2/2] Initializing RAG knowledge base...");
  await initRAG();
  console.log("RAG ready\n");

  const history = [{ role: "system", content: SYSTEM_PROMPT }];

  for (let i = 0; i < DEMO_QUESTIONS.length; i++) {
    const question = DEMO_QUESTIONS[i];
    console.log(`\n${"=".repeat(60)}`);
    console.log(`Question ${i + 1}/${DEMO_QUESTIONS.length}: ${question}`);
    console.log("-".repeat(60));

    // Get RAG context
    const ragContext = await queryRAG(question);
    const userMessage = ragContext ? `${question}\n\n[Context: ${ragContext}]` : question;
    history.push({ role: "user", content: userMessage });

    // Generate response
    const inferStart = Date.now();
    let firstTokenTime = null;
    let tokenCount = 0;
    let response = "";

    process.stdout.write("\nMedPsy: ");
    const result = completion({ modelId, history, stream: true });
    for await (const token of result.tokenStream) {
      if (!firstTokenTime) firstTokenTime = Date.now() - inferStart;
      tokenCount++;
      response += token;
      process.stdout.write(token);
    }

    const totalTime = Date.now() - inferStart;
    const tps = tokenCount / (totalTime / 1000);

    logger.logInference({
      prompt: question.substring(0, 100),
      tokenCount,
      ttft: firstTokenTime,
      tokensPerSecond: tps.toFixed(2),
      totalTime,
    });

    console.log(`\n   [TTFT: ${firstTokenTime}ms | ${tps.toFixed(1)} tok/s | ${tokenCount} tokens]`);
    history.push({ role: "assistant", content: response });
  }

  // Save performance log
  logger.saveToFile("performance-log.json");

  // Unload model
  await unloadModel({ modelId });

  console.log(`\n${"=".repeat(60)}`);
  console.log("Demo complete!");
  console.log("Performance log saved to: performance-log.json");
  console.log("=".repeat(60));
}

runDemo().catch((err) => {
  console.error("Demo failed:", err);
  process.exit(1);
});
