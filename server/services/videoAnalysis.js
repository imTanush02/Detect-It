const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const crypto = require('crypto');
const util = require('util');
const { analyzeImage } = require('./imageAnalysis');

const execPromise = util.promisify(exec);

/**
 * Video Analysis Service
 * Uses ffmpeg to extract frames, then runs image analysis on each frame.
 */
async function analyzeVideo(fileBuffer) {
  const flags = [];
  const frameScores = [];
  let aiScore = 50;
  
  // 1. Setup Temp Paths
  const tempDir = os.tmpdir();
  const uniqueId = crypto.randomUUID();
  const videoPath = path.join(tempDir, `video_${uniqueId}.mp4`);
  const framePattern = path.join(tempDir, `frame_${uniqueId}_%d.jpg`);

  try {
    // 2. Write buffer to disk
    fs.writeFileSync(videoPath, fileBuffer);

    // 3. Extract 3-5 frames using ffmpeg
    // We grab up to 3 frames spaced out natively using a simple thumbnail filter or just taking the first 3.
    // To ensure we get frames spaced out, we use fps=1.
    // If exact spacing is needed, this is tricky via basic ffmpeg, but 'thumbnail' is a fast safe bet.
    // Wait, simple approaches works best. Let's get 3 frames natively.
    const extractCmd = `ffmpeg -y -i "${videoPath}" -vframes 5 "${framePattern}"`;
    
    try {
      await execPromise(extractCmd);
    } catch (ffmpegErr) {
      console.warn("FFMPEG execution failed. Ensure ffmpeg is installed and in PATH:", ffmpegErr.message);
      flags.push("Failed to extract video frames via FFMPEG. FFMPEG must be installed locally.");
      return { aiScore: 50, frameScores: [], flags, confidence: "low" };
    }

    // 4. Read frames back from disk
    const framesToProcess = [];
    for (let i = 1; i <= 5; i++) {
      const framePath = path.join(tempDir, `frame_${uniqueId}_${i}.jpg`);
      if (fs.existsSync(framePath)) {
        framesToProcess.push({
          buffer: fs.readFileSync(framePath),
          path: framePath
        });
      }
    }

    if (framesToProcess.length === 0) {
      flags.push("FFMPEG succeeded but generated 0 frames.");
      return { aiScore: 50, frameScores: [], flags, confidence: "low" };
    }

    // 5. Process EACH frame via imageAnalysis
    // Process sequentially to avoid HF free-tier concurrent stream aborts
    const results = [];
    for (const frame of framesToProcess) {
      const res = await analyzeImage(frame.buffer, "image/jpeg");
      results.push(res);
    }

    // 6. Average the scores
    let totalScore = 0;
    results.forEach((res, index) => {
      frameScores.push(res.aiScore);
      totalScore += res.aiScore;
      if (res.flags && res.flags.length > 0) {
        flags.push(`Frame ${index + 1}: ${res.flags[0]}...`); // Only grab the most prominent flag per frame
      }
    });

    aiScore = Math.round(totalScore / results.length);

    // Cleanup extracted frames
    framesToProcess.forEach(f => {
      try { fs.unlinkSync(f.path); } catch(e){}
    });

  } catch (err) {
    console.error("Video processing error:", err.message);
    flags.push("Fatal error occurred extracting video frames: " + err.message);
  } finally {
    // Cleanup Temp Video
    try {
      if (fs.existsSync(videoPath)) {
        fs.unlinkSync(videoPath);
      }
    } catch (cleanErr) {}
  }

  return {
    aiScore,
    frameScores,
    flags,
    confidence: "medium"
  };
}

module.exports = { analyzeVideo };
