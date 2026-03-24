import { Link } from "react-router-dom";

function getScoreColor(score) {
  if (score >= 75) return "text-red-400 border-red-500/30 bg-red-500/10";
  if (score >= 40) return "text-amber-400 border-amber-500/30 bg-amber-500/10";
  return "text-green-400 border-green-500/30 bg-green-500/10";
}

function getTypeIcon(type) {
  if (type === "image") {
    return (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    );
  }
  if (type === "video") {
    return (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    );
  }
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  );
}

export default function ResultCard({ analysis }) {
  const { _id, inputType, inputSource, aiScore, trustScore, createdAt } = analysis;
  const scoreColor = getScoreColor(aiScore);
  const date = new Date(createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  /* Truncate long URLs/filenames */
  const displayName =
    inputSource.length > 40
      ? inputSource.slice(0, 37) + "..."
      : inputSource;

  return (
    <Link
      to={`/result/${_id}`}
      className="glass glass-hover rounded-2xl p-5 flex flex-col gap-4 transition-all duration-300 group"
    >
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-white/40">
          {getTypeIcon(inputType)}
          <span className="text-xs font-medium uppercase tracking-wider">
            {inputType}
          </span>
        </div>
        <span className="text-xs text-white/25">{date}</span>
      </div>

      {/* Source */}
      <p className="text-sm text-white/70 font-medium truncate" title={inputSource}>
        {displayName}
      </p>

      {/* Scores */}
      <div className="flex items-center gap-3 mt-auto">
        <span
          className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${scoreColor}`}
        >
          AI: {aiScore}%
        </span>
        <span className="px-3 py-1.5 rounded-lg text-xs font-bold border text-brand-300 border-brand-500/30 bg-brand-500/10">
          Trust: {trustScore}%
        </span>
      </div>

      {/* Hover indicator */}
      <div className="h-0.5 w-0 group-hover:w-full bg-gradient-to-r from-brand-500 to-brand-400 rounded-full transition-all duration-500" />
    </Link>
  );
}
