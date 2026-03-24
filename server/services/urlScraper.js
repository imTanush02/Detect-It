/**
 * URL Scraper Service
 * Fetches a URL and extracts title, meta description, and body text
 * using axios + cheerio.
 */

const axios = require("axios");
const cheerio = require("cheerio");

async function scrapeUrl(url) {
  try {
    const { data: html } = await axios.get(url, {
      timeout: 10000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    const $ = cheerio.load(html);

    const title = $("title").first().text().trim();
    const metaDescription =
      $('meta[name="description"]').attr("content") ||
      $('meta[property="og:description"]').attr("content") ||
      "";
    const ogImage =
      $('meta[property="og:image"]').attr("content") || "";

    /* Extract visible body text (strip scripts, styles, navs) */
    $("script, style, nav, footer, header, aside").remove();
    const bodyText = $("body").text().replace(/\s+/g, " ").trim().slice(0, 5000);

    return {
      success: true,
      title,
      metaDescription: metaDescription.trim(),
      ogImage,
      bodyText,
      url,
    };
  } catch (err) {
    return {
      success: false,
      title: "",
      metaDescription: "",
      ogImage: "",
      bodyText: "",
      url,
      error: err.message,
    };
  }
}

module.exports = { scrapeUrl };
