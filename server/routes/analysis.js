const express = require("express");
const router = express.Router();

const upload = require("../middleware/upload");
const {
  analyzeFile,
  analyzeUrl,
  getHistory,
  getAnalysisById,
} = require("../controllers/analysisController");

/* File upload analysis (image or video) */
router.post("/analyze/file", upload.single("file"), analyzeFile);

/* URL analysis */
router.post("/analyze/url", analyzeUrl);

/* Paginated history */
router.get("/history", getHistory);

/* Single analysis by ID */
router.get("/analysis/:id", getAnalysisById);

module.exports = router;
