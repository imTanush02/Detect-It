import { useState } from "react";

export default function TextInput({ onSubmit, disabled }) {
  const [text, setText] = useState("");

  const charCount = text.length;
  const wordCount = text.trim().length > 0 ? text.trim().split(/\s+/).length : 0;
  const isValid = text.trim().length >= 20;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isValid && !disabled) {
      onSubmit(text.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste the text you want to analyze for AI-generation signals..."
          disabled={disabled}
          rows={8}
          className="w-full px-4 py-4 rounded-xl bg-surface-800/80 border border-white/10 
                     text-white placeholder-white/25 focus:outline-none focus:border-brand-500/50 
                     focus:ring-2 focus:ring-brand-500/20 transition-all disabled:opacity-50
                     resize-y min-h-[120px] leading-relaxed text-sm"
        />
        {/* Character & word count */}
        <div className="absolute bottom-3 right-3 flex items-center gap-3 text-[11px] text-white/25 select-none pointer-events-none">
          <span>{wordCount} words</span>
          <span>{charCount} chars</span>
        </div>
      </div>

      {/* Minimum characters hint */}
      {text.length > 0 && text.length < 20 && (
        <p className="text-xs text-amber-400/70">
          Minimum 20 characters required for analysis ({20 - text.trim().length} more needed)
        </p>
      )}

      <button
        type="submit"
        disabled={!isValid || disabled}
        className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-300
                   bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400
                   shadow-lg shadow-brand-600/20 hover:shadow-brand-500/30
                   disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none
                   active:scale-[0.98]"
      >
        ⚡ Analyze Text
      </button>
    </form>
  );
}
