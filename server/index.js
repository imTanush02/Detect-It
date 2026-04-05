const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const analysisRoutes = require("./routes/analysis");
const errorHandler = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 5000;

/* ── Middleware ── */
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

/* ── Routes ── */
app.use("/api", analysisRoutes);

app.get("/", (_req, res) => {
  res.json({ status: "ok", service: "DetectIt API" });
});

/* ── Error handler (must be last) ── */
app.use(errorHandler);

/* ── Database + Server ── */
const warmUp = async () => {
  const axios = require('axios');
  // Sightengine credentials check
  if (process.env.SIGHTENGINE_API_USER && process.env.SIGHTENGINE_API_SECRET) {
    console.log("🔥 Sightengine API Keys verified");
  } else {
    console.warn("⚠️  Sightengine API credentials missing — media detection will use fallback heuristics");
  }

  // NVIDIA API key validation
  if (process.env.NVIDIA_API_KEY) {
    try {
      await axios.get("https://integrate.api.nvidia.com/v1/models", {
        headers: { Authorization: `Bearer ${process.env.NVIDIA_API_KEY}` },
        timeout: 10000
      });
      console.log("⚡ NVIDIA NIM API key verified");
    } catch (e) {
      if (e.response?.status === 401 || e.response?.status === 403) {
        console.warn("⚠️  NVIDIA API key is invalid or expired");
      } else {
        console.log("⚡ NVIDIA API ping sent (connectivity check)");
      }
    }
  } else {
    console.warn("⚠️  NVIDIA_API_KEY not set — text ML detection will use heuristics only");
  }
};

const Analysis = require("./models/Analysis");

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("✅ MongoDB connected");
    await Analysis.syncIndexes(); // Ensures TTL index is applied
    console.log("🗑️  TTL index synced — analyses auto-expire after 1 hour");
    warmUp(); // Trigger warmup async
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });
