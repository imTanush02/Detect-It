/**
 * Mock Reverse Image Search Service
 * Simulates checking whether an image appears elsewhere on the web.
 */

function reverseSearch(fileBuffer) {
  return new Promise((resolve) => {
    const delay = 600 + Math.random() * 1000;

    setTimeout(() => {
      const matchCount = Math.floor(Math.random() * 20);
      const hasExactMatch = Math.random() > 0.6;

      const sources = [];
      const domains = [
        "stock-photos.com", "pixabay.com", "unsplash.com",
        "shutterstock.com", "gettyimages.com", "flickr.com",
        "pexels.com", "reddit.com", "twitter.com",
      ];

      for (let i = 0; i < Math.min(matchCount, 5); i++) {
        sources.push({
          domain: domains[Math.floor(Math.random() * domains.length)],
          similarity: Math.round((0.5 + Math.random() * 0.5) * 100) / 100,
          firstSeen: new Date(
            Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000
          ).toISOString(),
        });
      }

      resolve({
        provider: "MockReverseSearch",
        totalMatches: matchCount,
        hasExactMatch,
        sources,
      });
    }, delay);
  });
}

module.exports = { reverseSearch };
