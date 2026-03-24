export default function LoadingOverlay({ message = "Analyzing content..." }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-950/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-6 page-enter">
        {/* Animated scanner rings */}
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 rounded-full border-2 border-brand-500/30 animate-ping-slow" />
          <div className="absolute inset-2 rounded-full border-2 border-brand-400/20 animate-ping-slow" style={{ animationDelay: "0.4s" }} />
          <div className="absolute inset-4 rounded-full border-2 border-brand-300/10 animate-ping-slow" style={{ animationDelay: "0.8s" }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-10 h-10 text-brand-400 animate-spin-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
        </div>

        <div className="text-center space-y-2">
          <p className="text-lg font-semibold text-white">{message}</p>
          <p className="text-sm text-white/40">Running multi-layered verification</p>
        </div>

        {/* Progress dots */}
        <div className="flex gap-1.5">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-brand-500 animate-pulse-glow"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
