/**
 * Analysis Controller
 * Orchestrates file/URL analysis by calling all mock services,
 * computing combined scores, and persisting results to MongoDB.
 */

const Analysis = require("../models/Analysis");
const { analyzeImage } = require("../services/imageAnalysis");
const { analyzeText } = require("../services/textAnalysis");
const { reverseSearch } = require("../services/reverseImageSearch");
const { scrapeUrl } = require("../services/urlScraper");

/**
 * Combines individual scores into a final AI probability score.
 */
function computeCombinedScore({ imageResult, textResult, searchResult }) {
  let total = 0;
  let weight = 0;

  if (imageResult) {
    total += imageResult.aiProbability * 0.5;
    weight += 0.5;
  }

  if (textResult) {
    const textAiScore = 100 - textResult.credibilityScore;
    total += textAiScore * 0.3;
    weight += 0.3;
  }

  if (searchResult) {
    const searchScore = searchResult.hasExactMatch
      ? 20
      : searchResult.totalMatches > 5
      ? 35
      : 50;
    total += searchScore * 0.2;
    weight += 0.2;
  }

  return weight > 0 ? Math.round(total / weight) : 50;
}

/**
 * Generates a human-readable explanation from analysis results.
 */
function generateExplanation(aiScore, { imageResult, textResult, searchResult }) {
  const parts = [];

  if (aiScore >= 75) {
    parts.push(
      "This content has a HIGH probability of being AI-generated or manipulated."
    );
  } else if (aiScore >= 40) {
    parts.push(
      "This content shows MODERATE indicators of AI generation or manipulation."
    );
  } else {
    parts.push(
      "This content appears to be LIKELY AUTHENTIC with low AI indicators."
    );
  }

  if (imageResult && imageResult.flags.length > 0) {
    parts.push(`Image analysis flags: ${imageResult.flags.join("; ")}.`);
  }

  if (textResult && textResult.flags.length > 0) {
    parts.push(`Text analysis flags: ${textResult.flags.join("; ")}.`);
  }

  if (searchResult) {
    if (searchResult.hasExactMatch) {
      parts.push(
        "An exact match was found online — this image may be sourced from existing content."
      );
    } else if (searchResult.totalMatches > 0) {
      parts.push(
        `${searchResult.totalMatches} similar image(s) found online.`
      );
    }
  }

  return parts.join(" ");
}

/* ── POST /api/analyze/file ── */
async function analyzeFile(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const isVideo = req.file.mimetype.startsWith("video/");
    const inputType = isVideo ? "video" : "image";

    const [imageResult, searchResult] = await Promise.all([
      analyzeImage(req.file.buffer, req.file.mimetype),
      reverseSearch(req.file.buffer),
    ]);

    const aiScore = computeCombinedScore({ imageResult, searchResult });
    const trustScore = Math.max(0, 100 - aiScore);
    const explanation = generateExplanation(aiScore, { imageResult, searchResult });

    const analysis = await Analysis.create({
      inputType,
      inputSource: req.file.originalname,
      aiScore,
      trustScore,
      explanation,
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
    if (scraped.ogImage) {
      imageResult = await analyzeImage(Buffer.alloc(0), "image/jpeg");
    }

    const aiScore = computeCombinedScore({ imageResult, textResult });
    const trustScore = Math.max(0, 100 - aiScore);
    const explanation = generateExplanation(aiScore, { imageResult, textResult });

    const analysis = await Analysis.create({
      inputType: "url",
      inputSource: url,
      aiScore,
      trustScore,
      explanation,
      details: {
        imageAnalysis: imageResult,
        textAnalysis: {
          ...textResult,
          scrapedTitle: scraped.title,
          scrapedMeta: scraped.metaDescription,
        },
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
