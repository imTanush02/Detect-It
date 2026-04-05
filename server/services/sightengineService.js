const axios = require('axios');
const FormData = require('form-data');

/**
 * Service to handle interaction with Sightengine API for AI-generated and Deepfake detection.
 */
async function analyzeSightengine(fileBuffer, originalFilename = 'file.jpg') {
  const { SIGHTENGINE_API_USER, SIGHTENGINE_API_SECRET } = process.env;

  if (!SIGHTENGINE_API_USER || !SIGHTENGINE_API_SECRET) {
    console.warn("Sightengine credentials missing. Using fallback.");
    return createFallbackResponse();
  }

  const form = new FormData();
  form.append('media', fileBuffer, { filename: originalFilename });
  form.append('models', 'genai,deepfake');
  form.append('api_user', SIGHTENGINE_API_USER);
  form.append('api_secret', SIGHTENGINE_API_SECRET);

  const startTime = Date.now();

  try {
    const response = await axios.post('https://api.sightengine.com/1.0/check.json', form, {
      headers: form.getHeaders(),
      timeout: 30000,
    });

    const latency = Date.now() - startTime;
    const data = response.data;

    if (data.status !== 'success') {
      console.warn("Sightengine API returned non-success status:", data.error?.message || data.status);
      return createFallbackResponse();
    }

    // Safely extract scores based on documentation (they are in data.type object)
    const aiGeneratedScore = (data.type?.ai_generated || 0) * 100;
    const deepfakeScore = (data.type?.deepfake || 0) * 100;

    // Adjust scoring logic using weighted average
    const finalScore = Math.round(0.7 * aiGeneratedScore + 0.3 * deepfakeScore);

    // Dynamic label including the uncertainty zone
    let label = finalScore >= 45 && finalScore <= 55 ? 'uncertain' 
              : finalScore > 55 ? 'ai-generated' 
              : 'human';

    // Confidence primarily based on the most reliable genai marker
    let confidence = 'low';
    if (aiGeneratedScore > 80) confidence = 'high';
    else if (aiGeneratedScore > 50) confidence = 'medium';

    console.log(`[Sightengine] Latency: ${latency}ms | AI Score: ${aiGeneratedScore.toFixed(1)} | Deepfake Score: ${deepfakeScore.toFixed(1)} | Final: ${finalScore}`);

    return {
      aiScore: finalScore,
      confidence,
      label,
      signals: {
        aiGenerated: Math.round(aiGeneratedScore),
        deepfake: Math.round(deepfakeScore),
      },
      fallbackUsed: false,
      raw: data
    };

  } catch (err) {
    const latency = Date.now() - startTime;
    console.error(`[Sightengine] Error after ${latency}ms:`, err.message);
    return createFallbackResponse();
  }
}

function createFallbackResponse() {
  return {
    aiScore: 50,
    confidence: 'low',
    label: 'uncertain',
    signals: { aiGenerated: 50, deepfake: 50 },
    fallbackUsed: true,
    raw: null
  };
}

module.exports = { analyzeSightengine };
