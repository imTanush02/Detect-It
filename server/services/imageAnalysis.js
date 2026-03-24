/**
 * Mock Image Analysis Service
 * Simulates an AI image-detection API (e.g. Hive, Sightengine).
 * Returns a probability that the image is AI-generated.
 */

function analyzeImage(fileBuffer, mimetype) {
  return new Promise((resolve) => {
    const delay = 800 + Math.random() * 1200;

    setTimeout(() => {
      const aiProbability = Math.round(Math.random() * 10000) / 100;

      const flags = [];
      if (aiProbability > 70) flags.push("GAN artifacts detected");
      if (aiProbability > 50) flags.push("Unusual texture patterns");
      if (aiProbability > 85) flags.push("Metadata inconsistency");
      if (aiProbability > 40) flags.push("Uniform lighting anomaly");

      resolve({
        provider: "MockVision",
        aiProbability,
        confidence: Math.round((0.7 + Math.random() * 0.25) * 100) / 100,
        flags,
        metadata: {
          mimetype,
          sizeBytes: fileBuffer ? fileBuffer.length : 0,
          analyzedAt: new Date().toISOString(),
        },
      });
    }, delay);
  });
}

module.exports = { analyzeImage };
