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
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });
