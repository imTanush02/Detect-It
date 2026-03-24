import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import ScoreGauge from "../components/ScoreGauge";
import { fetchAnalysis } from "../api";

function DetailCard({ title, children }) {
  return (
    <div className="glass rounded-2xl p-5">
      <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-4">
        {title}
      </h3>
      {children}
    </div>
  );
}

function FlagBadge({ text }) {
  return (
    <span className="inline-block px-3 py-1 rounded-lg text-xs font-medium bg-amber-500/10 border border-amber-500/20 text-amber-300">
      {text}
    </span>
  );
}

export default function ResultDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetchAnalysis(id)
      .then(setData)
      .catch(() => setError("Analysis not found"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="page-enter max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="text-5xl mb-4">😕</div>
        <p className="text-lg font-semibold text-white/60">
          {error || "Something went wrong"}
        </p>
        <Link
          to="/"
          className="inline-block mt-6 px-6 py-2.5 rounded-xl text-sm font-medium bg-brand-600 hover:bg-brand-500 transition-colors"
        >
          Back to Home
        </Link>
      </div>
    );
  }

  const { inputType, inputSource, aiScore, trustScore, explanation, details, createdAt } = data;
  const date = new Date(createdAt).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const imageAnalysis = details?.imageAnalysis;
  const textAnalysis = details?.textAnalysis;
  const reverseSearch = details?.reverseSearch;

  return (
    <div className="page-enter max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      {/* Back button */}
      <Link
        to="/history"
        className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors mb-8"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to History
      </Link>

      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-brand-600/20 text-brand-300 border border-brand-500/20">
            {inputType}
          </span>
          <span className="text-xs text-white/25">{date}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white break-all">
          {inputSource}
        </h1>
      </div>

      {/* Score gauges */}
      <div className="glass rounded-2xl p-8 mb-8">
        <div className="flex flex-wrap justify-center gap-12">
          <ScoreGauge score={aiScore} label="AI Probability" />
          <ScoreGauge score={trustScore} label="Trust Score" />
        </div>
      </div>

      {/* Explanation */}
      <DetailCard title="Analysis Summary">
        <p className="text-sm text-white/70 leading-relaxed">{explanation}</p>
      </DetailCard>

      {/* Detail breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
        {/* Image analysis */}
        {imageAnalysis && (
          <DetailCard title="Image Analysis">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/40">Provider</span>
                <span className="text-xs font-medium text-white/70">{imageAnalysis.provider}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/40">AI Probability</span>
                <span className="text-xs font-bold text-white/80">{imageAnalysis.aiProbability}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/40">Confidence</span>
                <span className="text-xs font-medium text-white/70">{(imageAnalysis.confidence * 100).toFixed(0)}%</span>
              </div>
              {imageAnalysis.flags?.length > 0 && (
                <div className="pt-2 space-y-2">
                  <span className="text-xs text-white/40">Flags</span>
                  <div className="flex flex-wrap gap-1.5">
                    {imageAnalysis.flags.map((f, i) => (
                      <FlagBadge key={i} text={f} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DetailCard>
        )}

        {/* Text analysis */}
        {textAnalysis && (
          <DetailCard title="Text Analysis">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/40">Provider</span>
                <span className="text-xs font-medium text-white/70">{textAnalysis.provider}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/40">Credibility</span>
                <span className="text-xs font-bold text-white/80">{textAnalysis.credibilityScore}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/40">Sentiment</span>
                <span className="text-xs font-medium text-white/70 capitalize">{textAnalysis.sentiment}</span>
              </div>
              {textAnalysis.scrapedTitle && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/40">Page Title</span>
                  <span className="text-xs font-medium text-white/70 truncate max-w-[200px]">{textAnalysis.scrapedTitle}</span>
                </div>
              )}
              {textAnalysis.flags?.length > 0 && (
                <div className="pt-2 space-y-2">
                  <span className="text-xs text-white/40">Flags</span>
                  <div className="flex flex-wrap gap-1.5">
                    {textAnalysis.flags.map((f, i) => (
                      <FlagBadge key={i} text={f} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DetailCard>
        )}

        {/* Reverse search */}
        {reverseSearch && (
          <DetailCard title="Reverse Image Search">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/40">Total Matches</span>
                <span className="text-xs font-bold text-white/80">{reverseSearch.totalMatches}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/40">Exact Match</span>
                <span className={`text-xs font-bold ${reverseSearch.hasExactMatch ? "text-red-400" : "text-green-400"}`}>
                  {reverseSearch.hasExactMatch ? "Yes" : "No"}
                </span>
              </div>
              {reverseSearch.sources?.length > 0 && (
                <div className="pt-2 space-y-2">
                  <span className="text-xs text-white/40">Sources</span>
                  {reverseSearch.sources.map((s, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02]">
                      <span className="text-xs text-white/60">{s.domain}</span>
                      <span className="text-xs text-white/40">{(s.similarity * 100).toFixed(0)}% match</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DetailCard>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 mt-8 justify-center">
        <Link
          to="/"
          className="px-6 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 shadow-lg shadow-brand-600/20 transition-all active:scale-[0.98]"
        >
          Analyze Another
        </Link>
        <Link
          to="/history"
          className="px-6 py-3 rounded-xl text-sm font-semibold glass hover:bg-white/5 transition-all"
        >
          View All History
        </Link>
      </div>
    </div>
  );
}
