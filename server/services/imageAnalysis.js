const axios = require("axios");

/**
 * Helper to call Hugging Face with Retry Logic to handle Cold Starts & Rate Limits
 */
async function callHF(url, buffer, contentType = "image/jpeg", retries = 1) {
  try {
    const res = await axios.post(url, buffer, {
      headers: {
        "Authorization": `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        "Content-Type": contentType
      },
      timeout: 60000 // Increased timeout for heavy HF free tier limits
    });
    return { status: "fulfilled", value: res };
  } catch (err) {
    if (retries > 0) {
      console.log(`HF API failed for ${url} (stream aborted/timeout). Retrying...`);
      return callHF(url, buffer, contentType, retries - 1);
    }
    return { status: "rejected", reason: err };
  }
}

/**
 * Image Analysis Service
 * Uses Google ViT (Classification) and gracefully handles free-tier HF timeouts.
 */
async function analyzeImage(fileBuffer, mimetype = "image/jpeg") {
  const flags = [];
  let aiScore = 50; 
  let vitResult = null;

  const { HUGGINGFACE_API_KEY } = process.env;

  if (!HUGGINGFACE_API_KEY) {
    return {
      aiScore: 50,
      flags: ["HUGGINGFACE_API_KEY is missing. Cannot perform ML analysis."],
      confidence: "low"
    };
  }

  try {
    // 1. Send image buffer to ViT Model (DETR removed for stability per user request)
    const vitResponse = await callHF(
      "https://api-inference.huggingface.co/models/google/vit-base-patch16-224", 
      fileBuffer, 
      mimetype, 
      1
    );

    // Handle ViT Response
    if (vitResponse.status === "fulfilled" && Array.isArray(vitResponse.value.data)) {
      vitResult = vitResponse.value.data;
    } else if (vitResponse.status === "rejected") {
      const errorMsg = vitResponse.reason.message;
      console.warn("ViT model error:", errorMsg);
      // Graceful fallback for timeouts and stream aborts
      if (errorMsg.includes("aborted") || errorMsg.includes("timeout") || errorMsg.includes("503")) {
        return {
          aiScore: 55,
          flags: ["HF timeout, fallback used", "Model stream aborted or timed out during heavy load."],
          confidence: "low"
        };
      }
      flags.push("Failed to get classification from ViT model.");
    }

    // ----------------------------------------------------------------
    // 2. Scoring Logic: ViT (Classification)
    // ----------------------------------------------------------------
    if (vitResult && vitResult.length > 0) {
      const topLabel = vitResult[0];
      const topConfidence = topLabel.score;

      if (topConfidence < 0.6) {
        aiScore = 80; 
        flags.push(`ViT: Low classification confidence (${(topConfidence * 100).toFixed(1)}% for '${topLabel.label}'). Indicates possible AI chaos.`);
      } else {
        aiScore = 20; 
        flags.push(`ViT: High confidence (${(topConfidence * 100).toFixed(1)}%) in subject '${topLabel.label}'.`);
      }

      if (vitResult.length > 1) {
        const secondConfidence = vitResult[1].score;
        if (topConfidence - secondConfidence < 0.05) {
          aiScore += 15; 
        }
      }
    } else if (!vitResult) {
      aiScore = 60; // Slightly suspicious if model completely failed without a direct timeout string
      flags.push("AI models unavailable or returned empty data, fallback heuristic used.");
    }

  } catch (err) {
    console.error("Deep Image Analysis Error:", err.message);
    flags.push("API communication error. Could not complete full deep analysis.");
  }

  // Ensure bounds
  aiScore = Math.max(0, Math.min(100, aiScore));

  // Smart Confidence System
  let overallConfidence = "low";
  if (aiScore > 75) overallConfidence = "high";
  else if (aiScore > 50) overallConfidence = "medium";

  return {
    aiScore: Math.round(aiScore),
    flags,
    confidence: overallConfidence
  };
}

module.exports = { analyzeImage };
