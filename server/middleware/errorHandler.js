/**
 * Centralized Error Handler Middleware
 */
function errorHandler(err, _req, res, _next) {
  console.error("❌ Error:", err.message);

  if (err.name === "MulterError") {
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }

  if (err.name === "ValidationError") {
    return res.status(400).json({ error: err.message });
  }

  if (err.name === "CastError" && err.kind === "ObjectId") {
    return res.status(400).json({ error: "Invalid ID format" });
  }

  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
  });
}

module.exports = errorHandler;
