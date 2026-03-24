import { useState } from "react";

export default function UrlInput({ onSubmit, disabled }) {
  const [url, setUrl] = useState("");

  const isValid =
    url.trim().length > 0 &&
    /^https?:\/\/.+\..+/.test(url.trim());

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isValid && !disabled) {
      onSubmit(url.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="relative">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <svg
            className="w-5 h-5 text-white/30"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.924a4.5 4.5 0 00-1.242-7.244l-4.5-4.5a4.5 4.5 0 00-6.364 6.364L4.34 8.374"
            />
          </svg>
        </div>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/article-or-post"
          disabled={disabled}
          className="w-full pl-12 pr-4 py-4 rounded-xl bg-surface-800/80 border border-white/10 
                     text-white placeholder-white/25 focus:outline-none focus:border-brand-500/50 
                     focus:ring-2 focus:ring-brand-500/20 transition-all disabled:opacity-50"
        />
      </div>
      <button
        type="submit"
        disabled={!isValid || disabled}
        className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-300
                   bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400
                   shadow-lg shadow-brand-600/20 hover:shadow-brand-500/30
                   disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none
                   active:scale-[0.98]"
      >
        Analyze URL
      </button>
    </form>
  );
}
