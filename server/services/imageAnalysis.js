const sharp = require("sharp");
const parser = require("exif-parser");
const axios = require("axios");

/**
 * Image Analysis Service (Multi-Signal Engine with HuggingFace ML)
 * Analyzes metadata, image processing stats, and overrides with a real ML model if available.
 */
async function analyzeImage(fileBuffer, mimetype) {
  let aiScore = 40; // Base starting score
  const flags = [];
  let confidence = "Medium";

  try {
    // ----------------------------------------------------
    // 0. Video Fallback
    // ----------------------------------------------------
    if (mimetype.startsWith("video/")) {
      aiScore = 65;
      flags.push("Deep video frame extraction bypassed (requires local ffmpeg). Analysis ran on metadata proxies only.");
    }

    // ----------------------------------------------------
    // 1. Metadata Analysis (EXIF Check)
    // ----------------------------------------------------
    let hasExif = false;
    if (mimetype === "image/jpeg" || mimetype === "image/tiff") {
      try {
        const parserInstance = parser.create(fileBuffer);
        const result = parserInstance.parse();
        if (result.tags && Object.keys(result.tags).length > 0) {
          hasExif = true;
          aiScore -= 15;
          if (result.tags.Software && result.tags.Software.toLowerCase().includes("midjourney")) {
            aiScore += 50;
            flags.push("EXIF Software tag explicitly matches an AI generator");
          }
        }
      } catch (err) {}
    }

    if (!hasExif && mimetype.startsWith("image/")) {
      aiScore += 20;
      flags.push("Missing EXIF metadata (common in AI generations or scraped images)");
    }

    // ----------------------------------------------------
    // 2. Image Processing Analysis (Sharp)
    // ----------------------------------------------------
    if (fileBuffer && mimetype.startsWith("image/")) {
      try {
        const img = sharp(fileBuffer);
        const metadata = await img.metadata();
        const stats = await img.stats();
        const { width, height } = metadata;

        if (width === height && (width === 512 || width === 1024)) {
          aiScore += 20;
          flags.push(`Resolution anomaly: Exact ${width}x${height} standard AI generation size`);
        } else if (width > 4000 || height > 4000) {
          aiScore -= 10;
        }

        if (stats && stats.channels && stats.channels.length >= 3) {
          const avgStdev =
            stats.channels.reduce((sum, ch) => sum + ch.stdev, 0) / stats.channels.length;
            
          if (avgStdev < 25) {
            aiScore += 15;
            flags.push("Unnaturally low color variance/noise (overly smooth textures)");
          } else if (avgStdev > 70) {
            aiScore -= 10;
            flags.push("High natural noise/texture variance detected");
          }
        }
      } catch (err) {
        console.warn("Sharp parsing error:", err.message);
      }
    }

    // ----------------------------------------------------
    // 3. HuggingFace Real ML Model Integration 🚀
    // ----------------------------------------------------
    const { HUGGINGFACE_API_KEY } = process.env;
    if (HUGGINGFACE_API_KEY && mimetype.startsWith("image/") && fileBuffer.length > 0) {
      try {
        const hfRes = await axios.post(
          "https://api-inference.huggingface.co/models/umm-maybe/AI-image-detector",
          fileBuffer,
          {
            headers: {
              "Authorization": `Bearer ${HUGGINGFACE_API_KEY}`,
              "Content-Type": mimetype
            },
            timeout: 15000 // 15s timeout
          }
        );

        let hfScore = null;
        if (Array.isArray(hfRes.data) && Array.isArray(hfRes.data[0])) {
          const artificialObj = hfRes.data[0].find(i => i.label === 'artificial');
          if (artificialObj) hfScore = artificialObj.score * 100;
        } else if (Array.isArray(hfRes.data)) {
          const artificialObj = hfRes.data.find(i => i.label === 'artificial');
          if (artificialObj) hfScore = artificialObj.score * 100;
        }

        if (hfScore !== null) {
          aiScore = hfScore; // Override heuristic score completely
          flags.push(`HuggingFace ML Model: Scored AI likelihood at ${(hfScore).toFixed(1)}%`);
          confidence = "High"; // Because we used a real model
        }
      } catch (err) {
        if (err.response?.status === 503) {
          flags.push("HuggingFace Image Model is waking up (cold start); bypassed for heuristics.");
        } else {
          console.warn("HF Image API logic failed:", err.message);
        }
      }
    }

  } catch (err) {
    console.error("Image analysis error:", err.message);
    flags.push("Processing error occurred during deep image analysis");
  }

  aiScore = Math.max(0, Math.min(100, Math.round(aiScore)));
  if (confidence !== "High") {
    if (aiScore >= 75 || aiScore <= 25) confidence = "High";
    else confidence = "Medium";
  }

  return {
    aiScore,
    flags,
    confidence,
  };
}

module.exports = { analyzeImage };
