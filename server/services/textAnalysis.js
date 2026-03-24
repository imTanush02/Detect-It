const axios = require("axios");

/**
 * Text / NLP Credibility Service (Multi-Signal Engine)
 * Heuristic-heavy analysis of text content for AI signatures,
 * credibility, and clickbait.
 */
async function analyzeText(text) {
  let aiScore = 40;       // Starting likelihood it's AI
  let credibility = 70;   // Starting credibility score
  const flags = [];

  if (!text || text.trim().length === 0) {
    return {
      aiScore: 0,
      credibilityScore: 0,
      flags: ["No text content to analyze"],
    };
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
      aiScore -= 5; // AI is usually less sensational than human spam, except when prompted
      flags.push("Excessive exclamation marks detected");
    }
    if (questionCount > 3) {
      aiScore += 5; // AI sometimes uses rhetoric questions frequently
      flags.push("High frequency of rhetorical questions");
    }

    // ----------------------------------------------------
    // 2. Capitalization Analysis
    // ----------------------------------------------------
    const words = rawText.split(/\s+/);
    const allCapsWords = words.filter(
      (w) => /^[A-Z]{3,}[!?.,]*$/.test(w) // Words with 3+ upper case letters
    );
    const capsRatio = allCapsWords.length / wordCount;

    if (capsRatio > 0.1) {
      credibility -= 15;
      aiScore -= 5; // AI rarely uses excessive ALL CAPS naturally
      flags.push("Excessive ALL CAPS usage");
    }

    // ----------------------------------------------------
    // 3. Repeated Phrases & AI Tropes
    // ----------------------------------------------------
    // AI often uses structural transitions
    const aiTropes = [
      "in conclusion", "it is important to note", "moreover",
      "additionally", "firstly", "delve into", "navigate",
      "testament", "realm", "ever-evolving", "multifaceted",
      "transformative", "let's dive in", "beacon", "landscape"
    ];
    let tropeCount = 0;
    aiTropes.forEach((trope) => {
      if (lower.includes(trope)) tropeCount++;
    });

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
    // 5. Repeated Phrase Check (N-gram repetition)
    // ----------------------------------------------------
    // Simple heuristic: Are there identical sequential 4-word phrases?
    const ngrams = [];
    for (let i = 0; i < words.length - 3; i++) {
        ngrams.push(words.slice(i, i + 4).join(" ").toLowerCase());
    }
    const ngramSet = new Set(ngrams);
    if (ngrams.length > 0 && (ngrams.length - ngramSet.size > 2)) {
      aiScore += 20;
      credibility -= 10;
      flags.push("Abnormal repetition of specific 4-word sequences (hallucination loop)");
    }

    // ----------------------------------------------------
    // 6. Optional Free API Integration (NLP Cloud)
    // ----------------------------------------------------
    const { NLP_CLOUD_KEY } = process.env;
    if (NLP_CLOUD_KEY) {
      // In a real scenario, call the sentiment or grammar API
      // axios.post('https://api.nlpcloud.io/v1/en/grammar', ...)
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
