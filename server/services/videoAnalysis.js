const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const crypto = require('crypto');
const util = require('util');
const ffmpegPath = require('ffmpeg-static');
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
    const extractCmd = `"${ffmpegPath}" -y -i "${videoPath}" -vf "fps=1" -vframes 3 "${framePattern}"`;
    
    try {
      await execPromise(extractCmd);
    } catch (ffmpegErr) {
      console.warn("FFMPEG execution failed. Ensure ffmpeg is installed and in PATH:", ffmpegErr.message);
      flags.push("Failed to extract video frames via FFMPEG. FFMPEG must be installed locally.");
      return { aiScore: 50, frameScores: [], flags, confidence: "low", confidenceStr: "low" };
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
      // Edge Case: No frames
      return { aiScore: 50, frameScores: [], flags, confidence: "low", confidenceStr: "low", fallbackUsed: true };
    }

    // 5. Process EACH frame via imageAnalysis
    const results = [];
    for (const frame of framesToProcess) {
      const res = await analyzeImage(frame.buffer, "image/jpeg");
      // Skip failed frame logic
      if (res.sightengineData && !res.sightengineData.fallbackUsed) {
        results.push(res);
      } else {
        // If it's a fallback result, we can still record it but maybe log it
        console.warn(`Frame failed Sightengine check.`);
      }
    }

    // 6. Average the scores
    let totalScore = 0;
    
    if (results.length === 0) {
      // Edge Case: All frames failed or generated fallback
      flags.push("All frames failed API analysis. Returning fallback.");
      return { aiScore: 50, frameScores: [], flags, confidence: "low", confidenceStr: "low", fallbackUsed: true };
    }
    
    results.forEach((res, index) => {
      frameScores.push(res.aiScore);
      totalScore += res.aiScore;
      if (res.flags && res.flags.length > 0) {
        // Collect primary flag
        flags.push(`Frame ${index + 1}: ${res.flags[0]}`); 
      }
    });

    aiScore = Math.round(totalScore / results.length);

    // Cleanup extracted frames
    framesToProcess.forEach(f => {
      try { fs.unlinkSync(f.path); } catch(e){}
    });

    // Provide highest confidence from frames or evaluate total
    let finalConfidenceStr = "low";
    let finalConfidence = 0.35;
    if (aiScore > 80) { finalConfidenceStr = "high"; finalConfidence = 0.95; }
    else if (aiScore > 50) { finalConfidenceStr = "medium"; finalConfidence = 0.65; }

    return {
      aiScore,
      frameScores,
      flags,
      confidence: finalConfidence,
      confidenceStr: finalConfidenceStr,
      provider: "Sightengine (Multi-Frame)",
      aiProbability: aiScore,
      sightengineData: results.length > 0 ? results[0].sightengineData : null // Use first valid as proxy for detailed signals
    };

  } catch (err) {
    console.error("Video processing error:", err.message);
    flags.push("Fatal error occurred extracting video frames: " + err.message);
    return { aiScore: 50, frameScores: [], flags, confidence: "low", confidenceStr: "low", fallbackUsed: true };
  } finally {
    // Cleanup Temp Video
    try {
      if (fs.existsSync(videoPath)) {
        fs.unlinkSync(videoPath);
      }
    } catch (cleanErr) {}
  }
}

module.exports = { analyzeVideo };

