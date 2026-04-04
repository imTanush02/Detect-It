/**
 * Analysis Controller
 * Orchestrates file/URL analysis by calling all intelligence services,
 * computing combined scores via a weighted heuristic system,
 * and generating detailed human-readable explanations.
 */

const Analysis = require("../models/Analysis");
const { analyzeImage } = require("../services/imageAnalysis");
const { analyzeVideo } = require("../services/videoAnalysis");
const { analyzeText } = require("../services/textAnalysis");
const { scrapeUrl } = require("../services/urlScraper");
const axios = require("axios");

/**
 * Combines individual scores into a final Multi-Signal AI probability score.
 */
function computeCombinedScore({ imageResult, videoResult, textResult }) {
  let totalAiScore = 0;
  let totalWeight = 0;

  const primaryResult = imageResult || videoResult;

  // We prioritize the ML model heavily if it was confident.
  let primaryWeight = (primaryResult && primaryResult.confidence && primaryResult.confidence.toLowerCase() === "high") ? 0.85 : 0.60;
  let textWeight = 1.0 - primaryWeight;

  if (primaryResult) {
    totalAiScore += primaryResult.aiScore * primaryWeight;
    totalWeight += primaryWeight;
  }

  if (textResult) {
    totalAiScore += textResult.aiScore * textWeight;
    totalWeight += textWeight;
  }

  if (totalWeight > 0) {
    return Math.max(0, Math.min(100, Math.round(totalAiScore / totalWeight)));
  }
  
  return 50; 
}

function buildAiExplanation(finalAiScore, { imageResult, videoResult, textResult }) {
  const explanationList = [];

  // 1. Overall Verdict
  if (finalAiScore >= 75) {
    explanationList.push("Verdict: This content has a HIGH probability of being AI-generated.");
  } else if (finalAiScore >= 40) {
    explanationList.push("Verdict: This content shows MODERATE mixed signals of manipulation.");
  } else {
    explanationList.push("Verdict: This content is LIKELY AUTHENTIC with very low AI indicators.");
  }

  // 2. Image / Video Signals
  const primaryResult = imageResult || videoResult;
  if (primaryResult && primaryResult.flags.length > 0) {
    const typeLabel = imageResult ? "Image Analysis" : "Video Analysis";
    explanationList.push(
      `${typeLabel} (${primaryResult.confidence} confidence): Detected - ${primaryResult.flags.join(", ")}.`
    );
  }

  // 3. Text Signals
  if (textResult && textResult.flags && textResult.flags.length > 0) {
    explanationList.push(
      `Text Analysis (Credibility Score: ${textResult.credibilityScore}%): Issues found - ${textResult.flags.join(", ")}.`
    );
  }

  return explanationList; 
}

/* ── POST /api/analyze/file ── */
async function analyzeFile(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const isVideo = req.file.mimetype.startsWith("video/");
    const inputType = isVideo ? "video" : "image";

    let imageResult = null;
    let videoResult = null;

    if (isVideo) {
      videoResult = await analyzeVideo(req.file.buffer);
    } else {
      imageResult = await analyzeImage(req.file.buffer, req.file.mimetype);
    }

    const finalAiProbability = computeCombinedScore({ imageResult, videoResult });
    const finalTrustScore = Math.max(0, 100 - finalAiProbability);
    
    const explanationArr = buildAiExplanation(finalAiProbability, { imageResult, videoResult });
    const finalExplanationStr = explanationArr.join(" ");

    const analysis = await Analysis.create({
      inputType,
      inputSource: req.file.originalname,
      aiScore: finalAiProbability,
      trustScore: finalTrustScore,
      explanation: finalExplanationStr,
      details: {
        imageAnalysis: imageResult,
        videoAnalysis: videoResult,
        reverseSearch: null,
      },
    });

    res.status(201).json(analysis);
  } catch (err) {
    next(err);
  }
}

/* ── POST /api/analyze/url ── */
async function analyzeUrl(req, res, next) {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    const scraped = await scrapeUrl(url);
    
    // Ignore text for now per user requirements
    const textResult = null;

    let imageResult = null;
    let videoResult = null;

    const isVideoUrl = !!url.match(/\.(mp4|webm|mov|avi)$/i) || !!scraped.ogVideo;
    const targetUrl = isVideoUrl ? (scraped.ogVideo || url) : (scraped.ogImage || url);

    if (targetUrl) {
      try {
        const fileRes = await axios.get(targetUrl, { responseType: 'arraybuffer' });
        const fileBuffer = Buffer.from(fileRes.data);
        const mimeType = fileRes.headers['content-type'] || (isVideoUrl ? 'video/mp4' : 'image/jpeg');
        
        if (mimeType.startsWith('video/') || isVideoUrl) {
          videoResult = await analyzeVideo(fileBuffer);
        } else {
          imageResult = await analyzeImage(fileBuffer, mimeType);
        }
      } catch (err) {
        console.error("Failed to download URL target:", err.message);
      }
    }

    const finalAiProbability = computeCombinedScore({ imageResult, videoResult, textResult });
    const finalTrustScore = Math.max(0, 100 - finalAiProbability);
    
    const explanationArr = buildAiExplanation(finalAiProbability, { imageResult, videoResult, textResult });
    const finalExplanationStr = explanationArr.join(" ");

    const analysis = await Analysis.create({
      inputType: "url",
      inputSource: url,
      aiScore: finalAiProbability,
      trustScore: finalTrustScore,
      explanation: finalExplanationStr,
      details: {
        imageAnalysis: imageResult,
        videoAnalysis: videoResult,
        textAnalysis: textResult ? {
          ...textResult,
          scrapedTitle: scraped.title,
        } : null,
        reverseSearch: null
      },
    });

    res.status(201).json(analysis);
  } catch (err) {
    next(err);
  }
}

/* ── GET /api/history ── */
async function getHistory(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 12));
    const skip = (page - 1) * limit;

    const [results, total] = await Promise.all([
      Analysis.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      Analysis.countDocuments(),
    ]);

    res.json({
      results,
      page,
      totalPages: Math.ceil(total / limit),
      totalResults: total,
    });
  } catch (err) {
    next(err);
  }
}

/* ── GET /api/analysis/:id ── */
async function getAnalysisById(req, res, next) {
  try {
    const analysis = await Analysis.findById(req.params.id);
    if (!analysis) {
      return res.status(404).json({ error: "Analysis not found" });
    }
    res.json(analysis);
  } catch (err) {
    next(err);
  }
}

/* ── POST /api/analyze/text ── */
async function analyzeTextInput(req, res, next) {
  try {
    const { text } = req.body;
    if (!text || text.trim().length < 20) {
      return res.status(400).json({ error: "Text is required (minimum 20 characters)" });
    }

    const textResult = await analyzeText(text.trim());

    if (!textResult) {
      return res.status(500).json({ error: "Text analysis failed" });
    }

    const finalAiProbability = textResult.aiScore;
    const finalTrustScore = Math.max(0, 100 - finalAiProbability);

    const explanationArr = [];

    if (textResult.nvidiaResult) {
      const nv = textResult.nvidiaResult;
      if (nv.verdict === "AI-generated") {
        explanationArr.push(`Verdict: This text has a HIGH probability of being AI-generated (${nv.ai_probability}% AI likelihood).`);
      } else if (nv.verdict === "Human-written") {
        explanationArr.push(`Verdict: This text is LIKELY HUMAN-WRITTEN with low AI indicators (${nv.ai_probability}% AI likelihood).`);
      } else {
        explanationArr.push(`Verdict: This text shows UNCERTAIN / mixed signals (${nv.ai_probability}% AI likelihood).`);
      }
      if (nv.summary) {
        explanationArr.push(nv.summary);
      }
    } else {
      if (finalAiProbability >= 75) {
        explanationArr.push("Verdict: This text has a HIGH probability of being AI-generated (heuristic analysis only).");
      } else if (finalAiProbability >= 40) {
        explanationArr.push("Verdict: This text shows MODERATE mixed signals of AI generation (heuristic analysis only).");
      } else {
        explanationArr.push("Verdict: This text is LIKELY AUTHENTIC with very low AI indicators (heuristic analysis only).");
      }
    }

    if (textResult.flags.length > 0) {
      explanationArr.push(`Signals: ${textResult.flags.join("; ")}`);
    }

    const inputPreview = text.trim().slice(0, 100) + (text.trim().length > 100 ? "..." : "");

    const analysis = await Analysis.create({
      inputType: "text",
      inputSource: inputPreview,
      aiScore: finalAiProbability,
      trustScore: finalTrustScore,
      explanation: explanationArr.join(" "),
      details: {
        textAnalysis: {
          aiScore: textResult.aiScore,
          credibilityScore: textResult.credibilityScore,
          flags: textResult.flags,
        },
        nvidiaAnalysis: textResult.nvidiaResult || null,
      },
    });

    res.status(201).json(analysis);
  } catch (err) {
    next(err);
  }
}

module.exports = { analyzeFile, analyzeUrl, analyzeTextInput, getHistory, getAnalysisById };
