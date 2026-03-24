import { useEffect, useState } from "react";

/**
 * Animated circular gauge that fills to display a score 0–100.
 * Color shifts from green → amber → red based on score.
 */
export default function ScoreGauge({ score = 0, size = 160, label = "AI Score" }) {
  const [animatedScore, setAnimatedScore] = useState(0);

  /* Animate the number count-up */
  useEffect(() => {
    let start = 0;
    const duration = 1500;
    const stepTime = 16;
    const steps = duration / stepTime;
    const increment = score / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= score) {
        setAnimatedScore(score);
        clearInterval(timer);
      } else {
        setAnimatedScore(Math.round(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [score]);

  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedScore / 100) * circumference;

  /* Dynamic color based on score */
  const getColor = (s) => {
    if (s >= 75) return { stroke: "#ef4444", text: "text-red-400", glow: "rgba(239,68,68,0.3)" };
    if (s >= 40) return { stroke: "#f59e0b", text: "text-amber-400", glow: "rgba(245,158,11,0.3)" };
    return { stroke: "#22c55e", text: "text-green-400", glow: "rgba(34,197,94,0.3)" };
  };

  const color = getColor(score);

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative"
        style={{ width: size, height: size }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full score-circle">
          {/* Background track */}
          <circle
            cx="50" cy="50" r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="8"
          />
          {/* Score arc */}
          <circle
            cx="50" cy="50" r={radius}
            fill="none"
            stroke={color.stroke}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              transition: "stroke-dashoffset 0.1s ease-out",
              filter: `drop-shadow(0 0 8px ${color.glow})`,
            }}
          />
        </svg>
        {/* Centered score text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-4xl font-bold ${color.text}`}>
            {animatedScore}
          </span>
          <span className="text-[10px] font-medium text-white/40 uppercase tracking-widest mt-0.5">
            percent
          </span>
        </div>
      </div>
      <span className="text-sm font-medium text-white/50">{label}</span>
    </div>
  );
}
