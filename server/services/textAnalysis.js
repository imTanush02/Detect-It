const axios = require("axios");

const NVIDIA_SYSTEM_PROMPT = `You are DetectIt AI — an advanced AI content verification engine.

Your job is to analyze input text and determine whether it is AI-generated or human-written.

SYSTEM CONTEXT:
- This is a temporary analysis tool (no user accounts).
- Results are stored only for a short duration (approx. 1 hour).
- Keep responses concise, structured, and optimized for fast API usage.
- Do NOT include unnecessary explanations outside JSON.

TASK:
Analyze the given text and provide:

1. AI generation probability (0–100%)
2. Confidence score (0–100%)
3. Final verdict:
   - "AI-generated"
   - "Human-written"
   - "Uncertain"
4. Key reasoning signals:
   - repetition
   - burstiness (lack of variation)
   - unnatural phrasing
   - overly structured tone
   - generic / predictable wording

OUTPUT FORMAT (STRICT JSON ONLY):

{
  "ai_probability": number,
  "confidence": number,
  "verdict": "AI-generated | Human-written | Uncertain",
  "signals": {
    "repetition": true/false,
    "low_burstiness": true/false,
    "unnatural_tone": true/false,
    "generic_phrasing": true/false
  },
  "reasons": ["short reason 1", "short reason 2"],
  "summary": "1-line explanation"
}`;

/**
 * Heuristic-based supplementary text analysis.
 * Computes AI trope count, clickbait hits, punctuation abuse, etc.
 */
function runHeuristics(text) {
  let aiScore = 40;
  let credibility = 70;
  const flags = [];

  const rawText = text.trim();
  const lower = rawText.toLowerCase();
  const wordCount = lower.split(/\s+/).length;

  // 1. Punctuation Analysis
  const exclaimCount = (rawText.match(/!/g) || []).length;
  const questionCount = (rawText.match(/\?/g) || []).length;

  if (exclaimCount > 3) {
    credibility -= 10;
    aiScore -= 5;
    flags.push("Excessive exclamation marks detected");
  }
  if (questionCount > 3) {
    aiScore += 5;
    flags.push("High frequency of rhetorical questions");
  }

  // 2. Capitalization Analysis
  const words = rawText.split(/\s+/);
  const allCapsWords = words.filter(w => /^[A-Z]{3,}[!?.,]*$/.test(w));
  const capsRatio = allCapsWords.length / wordCount;

  if (capsRatio > 0.1) {
    credibility -= 15;
    aiScore -= 5;
    flags.push("Excessive ALL CAPS usage");
  }

  // 3. Repeated Phrases & AI Tropes
  const aiTropes = [
    "in conclusion", "it is important to note", "moreover",
    "additionally", "firstly", "delve into", "navigate",
    "testament", "realm", "ever-evolving", "multifaceted",
    "transformative", "let's dive in", "beacon", "landscape"
  ];
  let tropeCount = 0;
  aiTropes.forEach((trope) => { if (lower.includes(trope)) tropeCount++; });

  if (tropeCount > 2) {
    aiScore += 25;
    flags.push(`Found high density of typical AI phrases (${tropeCount} instances)`);
  }

  // 4. Clickbait Detection
  const clickbaitWords = [
    "shocking", "unbelievable", "you won't believe", "breaking",
    "urgent", "miracle", "secret", "exposed", "outrageous", "mind-blowing"
  ];
  let clickbaitHits = clickbaitWords.filter((w) => lower.includes(w));
  if (clickbaitHits.length > 0) {
    credibility -= 20;
    flags.push(`Clickbait terms detected: ${clickbaitHits.join(", ")}`);
  }

  // 5. Sentence uniformity (burstiness heuristic)
  const sentences = rawText.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length > 3) {
    const lengths = sentences.map(s => s.trim().split(/\s+/).length);
    const avgLen = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = lengths.reduce((sum, l) => sum + Math.pow(l - avgLen, 2), 0) / lengths.length;
    const stdDev = Math.sqrt(variance);
    if (stdDev < 3) {
      aiScore += 10;
      flags.push("Low sentence length variance (uniform structure typical of AI)");
    }
  }

  aiScore = Math.max(0, Math.min(100, Math.round(aiScore)));
  credibility = Math.max(0, Math.min(100, Math.round(credibility)));

  return { aiScore, credibility, flags, tropeCount };
}

/**
 * Call NVIDIA NIM API for ML-powered AI text detection.
 * Returns parsed JSON response or null on failure.
 */
async function callNvidiaDetection(text) {
  const { NVIDIA_API_KEY } = process.env;
  if (!NVIDIA_API_KEY) {
    console.warn("NVIDIA_API_KEY not set — skipping ML detection");
    return null;
  }

  try {
    const response = await axios.post(
      "https://integrate.api.nvidia.com/v1/chat/completions",
      {
        model: "meta/llama-3.3-70b-instruct",
        messages: [
          { role: "system", content: NVIDIA_SYSTEM_PROMPT },
          {
            role: "user",
            content: `TEXT:\n"""\n${text.slice(0, 4000)}\n"""`
          }
        ],
        temperature: 0.1,
        top_p: 0.9,
        max_tokens: 512,
        stream: false
      },
      {
        headers: {
          "Authorization": `Bearer ${NVIDIA_API_KEY}`,
          "Content-Type": "application/json"
        },
        timeout: 30000
      }
    );

    const content = response.data?.choices?.[0]?.message?.content;
    if (!content) return null;

    // Extract JSON from the response (handle markdown code blocks)
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    } else {
      // Try to find raw JSON object
      const braceMatch = content.match(/\{[\s\S]*\}/);
      if (braceMatch) {
        jsonStr = braceMatch[0];
      }
    }

    const parsed = JSON.parse(jsonStr);

    // Validate required fields
    if (
      typeof parsed.ai_probability !== "number" ||
      typeof parsed.confidence !== "number" ||
      !parsed.verdict
    ) {
      console.warn("NVIDIA response missing required fields");
      return null;
    }

    return {
      ai_probability: Math.max(0, Math.min(100, Math.round(parsed.ai_probability))),
      confidence: Math.max(0, Math.min(100, Math.round(parsed.confidence))),
      verdict: parsed.verdict,
      signals: parsed.signals || {},
      reasons: Array.isArray(parsed.reasons) ? parsed.reasons : [],
      summary: parsed.summary || ""
    };
  } catch (err) {
    if (err.response?.status === 402) {
      console.warn("NVIDIA API credits exhausted");
    } else if (err.response?.status === 401 || err.response?.status === 403) {
      console.warn("NVIDIA API key invalid or unauthorized");
    } else {
      console.warn("NVIDIA API call failed:", err.message);
    }
    return null;
  }
}

/**
 * Main text analysis function.
 * Combines NVIDIA ML detection with heuristic signals.
 */
async function analyzeText(text) {
  if (!text || text.trim().length === 0) {
    return null;
  }

  const rawText = text.trim();

  // Run heuristics (always available, no API dependency)
  const heuristics = runHeuristics(rawText);

  // Run NVIDIA ML detection (primary signal)
  const nvidia = await callNvidiaDetection(rawText);

  let aiScore = heuristics.aiScore;
  let credibility = heuristics.credibility;
  const flags = [...heuristics.flags];

  if (nvidia) {
    // NVIDIA ML overrides heuristic score as the primary signal
    aiScore = nvidia.ai_probability;
    credibility = Math.max(0, 100 - nvidia.ai_probability);
    flags.unshift(`NVIDIA AI Detection: ${nvidia.verdict} (${nvidia.ai_probability}% AI, ${nvidia.confidence}% confidence)`);

    if (nvidia.reasons.length > 0) {
      nvidia.reasons.forEach(r => flags.push(r));
    }
  } else {
    flags.unshift("NVIDIA ML unavailable — using heuristic analysis only");
  }

  return {
    aiScore,
    credibilityScore: credibility,
    flags,
    nvidiaResult: nvidia
  };
}

module.exports = { analyzeText };
