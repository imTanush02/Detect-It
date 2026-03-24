import { useEffect, useState } from "react";
import ResultCard from "../components/ResultCard";
import { fetchHistory } from "../api";

export default function History() {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchHistory(page)
      .then(setData)
      .catch(() => setError("Failed to load history"))
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="page-enter max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-bold text-white">Analysis History</h1>
          <p className="text-sm text-white/40 mt-1">
            {data ? `${data.totalResults} total analyses` : "Loading..."}
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm text-center mb-8">
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass rounded-2xl p-5 animate-pulse space-y-4">
              <div className="h-3 w-16 bg-white/5 rounded" />
              <div className="h-4 w-3/4 bg-white/5 rounded" />
              <div className="flex gap-2">
                <div className="h-7 w-16 bg-white/5 rounded-lg" />
                <div className="h-7 w-20 bg-white/5 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Results grid */}
      {!loading && data && data.results.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {data.results.map((r) => (
              <ResultCard key={r._id} analysis={r} />
            ))}
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-10">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-lg text-sm font-medium glass hover:bg-white/5 disabled:opacity-30 transition-all"
              >
                ← Previous
              </button>
              <span className="text-sm text-white/40">
                Page {page} of {data.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
                className="px-4 py-2 rounded-lg text-sm font-medium glass hover:bg-white/5 disabled:opacity-30 transition-all"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {/* Empty state */}
      {!loading && data && data.results.length === 0 && (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-lg font-semibold text-white/60">No analyses yet</p>
          <p className="text-sm text-white/30 mt-1">
            Upload a file or paste a URL on the home page to get started.
          </p>
        </div>
      )}
    </div>
  );
}
