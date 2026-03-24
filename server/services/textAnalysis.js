/**
 * Mock Text / NLP Credibility Service
 * Simulates analysis of article text for clickbait, sensationalism,
 * and AI-generated content indicators.
 */

const CLICKBAIT_WORDS = [
  "shocking", "unbelievable", "you won't believe", "breaking", "urgent",
  "miracle", "secret", "exposed", "outrageous", "incredible",
];

function analyzeText(text) {
  return new Promise((resolve) => {
    const delay = 500 + Math.random() * 800;

    setTimeout(() => {
      if (!text || text.trim().length === 0) {
        return resolve({
          provider: "MockNLP",
          credibilityScore: 50,
          flags: ["No text content to analyze"],
          sentiment: "neutral",
        });
      }

      const lower = text.toLowerCase();
      const wordCount = text.split(/\s+/).length;

      /* Check for clickbait indicators */
      const clickbaitHits = CLICKBAIT_WORDS.filter((w) => lower.includes(w));
      const clickbaitRatio = clickbaitHits.length / CLICKBAIT_WORDS.length;

      /* Check for excessive punctuation */
      const exclaimCount = (text.match(/!/g) || []).length;
      const capsRatio =
        text.replace(/[^A-Za-z]/g, "").length > 0
          ? (text.replace(/[^A-Z]/g, "").length /
              text.replace(/[^A-Za-z]/g, "").length)
          : 0;

      /* Compute a credibility score (higher = more credible) */
      let credibility = 75;
      credibility -= clickbaitRatio * 40;
      credibility -= Math.min(exclaimCount * 2, 20);
      credibility -= capsRatio > 0.3 ? 15 : 0;
      credibility += wordCount > 200 ? 10 : 0;
      credibility = Math.max(5, Math.min(95, Math.round(credibility)));

      const flags = [];
      if (clickbaitHits.length > 0)
        flags.push(`Clickbait terms: ${clickbaitHits.join(", ")}`);
      if (capsRatio > 0.3) flags.push("Excessive capitalisation");
      if (exclaimCount > 3) flags.push("Excessive exclamation marks");
      if (wordCount < 50) flags.push("Very short content");

      const sentiment =
        credibility > 60 ? "neutral" : credibility > 35 ? "cautious" : "suspicious";

      resolve({
        provider: "MockNLP",
        credibilityScore: credibility,
        flags,
        sentiment,
        wordCount,
      });
    }, delay);
  });
}

module.exports = { analyzeText };
