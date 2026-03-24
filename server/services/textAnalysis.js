const axios = require("axios");

/**
 * Text / NLP Credibility Service (Multi-Signal Engine with HuggingFace ML)
 * Heuristic-heavy analysis of text content for AI signatures, credibility,
 * and clickbait. Overrides AI score with HuggingFace ML if available.
 */
async function analyzeText(text) {
  let aiScore = 40;       // Starting likelihood it's AI
  let credibility = 70;   // Starting credibility score
  const flags = [];

  if (!text || text.trim().length === 0) {
    return { aiScore: 0, credibilityScore: 0, flags: ["No text content to analyze"] };
  }

  try {
    const rawText = text.trim();
    const lower = rawText.toLowerCase();
    const wordCount = lower.split(/\s+/).length;

    // ----------------------------------------------------
    // 1. Punctuation Analysis
    // ----------------------------------------------------
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

    // ----------------------------------------------------
    // 2. Capitalization Analysis
    // ----------------------------------------------------
    const words = rawText.split(/\s+/);
    const allCapsWords = words.filter(w => /^[A-Z]{3,}[!?.,]*$/.test(w));
    const capsRatio = allCapsWords.length / wordCount;

    if (capsRatio > 0.1) {
      credibility -= 15;
      aiScore -= 5;
      flags.push("Excessive ALL CAPS usage");
    }

    // ----------------------------------------------------
    // 3. Repeated Phrases & AI Tropes
    // ----------------------------------------------------
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

    // ----------------------------------------------------
    // 4. Clickbait Detection
    // ----------------------------------------------------
    const clickbaitWords = [
      "shocking", "unbelievable", "you won't believe", "breaking",
      "urgent", "miracle", "secret", "exposed", "outrageous", "mind-blowing"
    ];
    let clickbaitHits = clickbaitWords.filter((w) => lower.includes(w));
    if (clickbaitHits.length > 0) {
      credibility -= 20;
      flags.push(`Clickbait terms detected: ${clickbaitHits.join(", ")}`);
    }

    // ----------------------------------------------------
    // 5. HuggingFace Real ML Model Integration 🚀
    // ----------------------------------------------------
    const { HUGGINGFACE_API_KEY } = process.env;
    if (HUGGINGFACE_API_KEY && rawText.length > 10) {
      try {
        const hfRes = await axios.post(
          "https://api-inference.huggingface.co/models/roberta-base-openai-detector",
          { inputs: rawText.slice(0, 512) }, // Limit length for HF payload limits
          {
            headers: {
              "Authorization": `Bearer ${HUGGINGFACE_API_KEY}`,
              "Content-Type": "application/json"
            },
            timeout: 10000
          }
        );

        let hfScore = null;
        if (Array.isArray(hfRes.data) && Array.isArray(hfRes.data[0])) {
          const fakeObj = hfRes.data[0].find(i => i.label === 'Fake');
          if (fakeObj) hfScore = fakeObj.score * 100;
        } else if (Array.isArray(hfRes.data)) {
          const fakeObj = hfRes.data.find(i => i.label === 'Fake');
          if (fakeObj) hfScore = fakeObj.score * 100;
        }

        if (hfScore !== null) {
          aiScore = hfScore; // Override heuristic entirely
          flags.push(`HuggingFace ML Model: Scored text AI likelihood at ${(hfScore).toFixed(1)}%`);
        }
      } catch (err) {
        if (err.response?.status === 503) {
          flags.push("HuggingFace Text Model is waking up (cold start); bypassed for heuristics.");
        } else {
          console.warn("HF Text API logic failed:", err.message);
        }
      }
    }

  } catch (err) {
    console.warn("Text analysis warning:", err.message);
  }

  aiScore = Math.max(0, Math.min(100, Math.round(aiScore)));
  credibility = Math.max(0, Math.min(100, Math.round(credibility)));

  return {
    aiScore,
    credibilityScore: credibility,
    flags,
  };
}

module.exports = { analyzeText };
