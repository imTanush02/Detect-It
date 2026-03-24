/**
 * Analysis Controller (Multi-Signal Engine Upgrade)
 * Orchestrates file/URL analysis by calling all intelligence services,
 * computing combined scores via a weighted heuristic system,
 * and generating detailed human-readable explanations.
 */

const Analysis = require("../models/Analysis");
const { analyzeImage } = require("../services/imageAnalysis");
const { analyzeText } = require("../services/textAnalysis");
const { reverseSearch } = require("../services/reverseImageSearch");
const { scrapeUrl } = require("../services/urlScraper");

/**
 * Combines individual scores into a final Multi-Signal AI probability score.
 * Weights: Image (40%), Text (30%), Search (30%)
 */
function computeCombinedScore({ imageResult, textResult, searchResult }) {
  let totalAiScore = 0;
  let totalWeight = 0;

  if (imageResult) {
    totalAiScore += imageResult.aiScore * 0.40;
    totalWeight += 0.40;
  }

  if (textResult) {
    totalAiScore += textResult.aiScore * 0.30;
    totalWeight += 0.30;
  }

  if (searchResult) {
    // Reverse search impactScore modifies the baseline pseudo-AI score
    // Baseline = 50. Impact = -30, -15, or +25
    let searchDerivedScore = 50 + searchResult.impactScore;
    searchDerivedScore = Math.max(0, Math.min(100, searchDerivedScore));
    
    totalAiScore += searchDerivedScore * 0.30;
    totalWeight += 0.30;
  }

  // Normalize final score
  if (totalWeight > 0) {
    return Math.max(0, Math.min(100, Math.round(totalAiScore / totalWeight)));
  }
  
  return 50; // Neutral fallback if nothing worked
}

/**
 * Bonus: Explains why this content is flagged as AI-generated.
 * Returns an array of strings as requested, which are then joined for the DB.
 */
function buildAiExplanation(finalAiScore, { imageResult, textResult, searchResult }) {
  const explanationList = [];

  // 1. Overall Verdict
  if (finalAiScore >= 75) {
    explanationList.push("Verdict: This content has a HIGH probability of being AI-generated.");
  } else if (finalAiScore >= 40) {
    explanationList.push("Verdict: This content shows MODERATE mixed signals of manipulation.");
  } else {
    explanationList.push("Verdict: This content is LIKELY AUTHENTIC with very low AI indicators.");
  }

  // 2. Image Signals
  if (imageResult && imageResult.flags.length > 0) {
    explanationList.push(
      `Image Analysis (${imageResult.confidence} confidence): Detected - ${imageResult.flags.join(", ")}.`
    );
  }

  // 3. Text Signals
  if (textResult && textResult.flags.length > 0) {
    explanationList.push(
      `Text Analysis (Credibility Score: ${textResult.credibilityScore}%): Issues found - ${textResult.flags.join(", ")}.`
    );
  }

  // 4. Reverse Search Signals
  if (searchResult) {
    if (searchResult.matchCount === 0) {
      explanationList.push("Reverse Search: ZERO matches found on the web, increasing AI likelihood.");
    } else {
      explanationList.push(`Reverse Search: Found ${searchResult.matchCount} similar matches across ${searchResult.sources.length} sources (e.g., ${searchResult.sources[0]}), which decreases AI likelihood.`);
    }
  }

  return explanationList; // Returns string[] as requested in prompt Bonus
}

/* ── POST /api/analyze/file ── */
async function analyzeFile(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const isVideo = req.file.mimetype.startsWith("video/");
    const inputType = isVideo ? "video" : "image";

    // Run deep analysis concurrently
    const [imageResult, searchResult] = await Promise.all([
      analyzeImage(req.file.buffer, req.file.mimetype),
      reverseSearch(req.file.buffer),
    ]);

    const finalAiProbability = computeCombinedScore({ imageResult, searchResult });
    const finalTrustScore = Math.max(0, 100 - finalAiProbability);
    
    // Build explanation string array and join for the database schema string
    const explanationArr = buildAiExplanation(finalAiProbability, { imageResult, searchResult });
    const finalExplanationStr = explanationArr.join(" ");

    const analysis = await Analysis.create({
      inputType,
      inputSource: req.file.originalname,
      aiScore: finalAiProbability,
      trustScore: finalTrustScore,
      explanation: finalExplanationStr,
      details: {
        imageAnalysis: imageResult,
        reverseSearch: searchResult,
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
    const textResult = await analyzeText(scraped.bodyText);

    let imageResult = null;
    let searchResult = null;

    if (scraped.ogImage) {
      // In a real system we'd download the OG image and analyze it
      // For this MVP, if there is an image URL we just simulate an empty buffer to trigger logic
      imageResult = await analyzeImage(Buffer.alloc(10), "image/jpeg");
      searchResult = await reverseSearch(Buffer.alloc(10));
    }

    const finalAiProbability = computeCombinedScore({ imageResult, textResult, searchResult });
    const finalTrustScore = Math.max(0, 100 - finalAiProbability);
    
    const explanationArr = buildAiExplanation(finalAiProbability, { imageResult, textResult, searchResult });
    const finalExplanationStr = explanationArr.join(" ");

    const analysis = await Analysis.create({
      inputType: "url",
      inputSource: url,
      aiScore: finalAiProbability,
      trustScore: finalTrustScore,
      explanation: finalExplanationStr,
      details: {
        imageAnalysis: imageResult,
        textAnalysis: {
          ...textResult,
          scrapedTitle: scraped.title,
        },
        reverseSearch: searchResult
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

module.exports = { analyzeFile, analyzeUrl, getHistory, getAnalysisById };
