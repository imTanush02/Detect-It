const mongoose = require("mongoose");

const analysisSchema = new mongoose.Schema(
  {
    inputType: {
      type: String,
      enum: ["image", "video", "url", "text"],
      required: true,
    },
    inputSource: {
      type: String,
      required: true,
    },
    aiScore: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },
    trustScore: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },
    explanation: {
      type: String,
      required: true,
    },
    details: {
      imageAnalysis: { type: Object, default: null },
      videoAnalysis: { type: Object, default: null },
      textAnalysis: { type: Object, default: null },
      nvidiaAnalysis: { type: Object, default: null },
      reverseSearch: { type: Object, default: null },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Analysis", analysisSchema);
