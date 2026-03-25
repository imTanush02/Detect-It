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
  try {
    await axios.post(
      "https://api-inference.huggingface.co/models/google/vit-base-patch16-224",
      Buffer.alloc(10), // tiny dummy payload
      {
        headers: { Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}` },
        timeout: 10000 // quick timeout for warmup just to wake it
      }
    );
    console.log("🔥 HF ViT Model Warmed up");
  } catch (e) {
    if (e.response?.status === 503) {
      console.log("🔥 HF ViT Model is booting up (expected warmup behavior)");
    } else {
      console.log("🔥 HF Warmup ping sent (expected to error on dummy buffer)");
    }
  }
};

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    warmUp(); // Trigger warmup async
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });
