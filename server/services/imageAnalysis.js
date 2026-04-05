const { analyzeSightengine } = require('./sightengineService');

/**
 * Image Analysis Service
 * Uses Sightengine API for robust AI and Deepfake detection.
 */
async function analyzeImage(fileBuffer, mimetype = "image/jpeg") {
  const flags = [];
  
  // Call the new Sightengine service layer
  const sightengineResult = await analyzeSightengine(fileBuffer, "upload.jpg");

  // Map result values
  const { aiScore, confidence, label, signals, fallbackUsed } = sightengineResult;

  // Generate flags based on the results
  if (fallbackUsed) {
    flags.push("Sightengine API unavailable, fallback heuristics used");
  } else {
    flags.push(`GenAI Score: ${signals.aiGenerated}%`);
    if (signals.deepfake > 20) {
      flags.push(`Deepfake probability: ${signals.deepfake}%`);
    }
  }

  // Map string confidence to float for frontend (which does * 100)
  const confidenceMap = {
    "high": 0.95,
    "medium": 0.65,
    "low": 0.35
  };

  return {
    aiScore,
    confidenceStr: confidence, // Retain string for controller logic if needed
    flags,
    // Add additional properties to make the frontend ResultDetail look populated
    provider: "Sightengine API",
    aiProbability: aiScore,
    confidence: confidenceMap[confidence] || 0.5,
    sightengineData: sightengineResult
  };
}

module.exports = { analyzeImage };

