import { useState } from "react";
import { useNavigate } from "react-router-dom";
import UploadZone from "../components/UploadZone";
import UrlInput from "../components/UrlInput";
import TextInput from "../components/TextInput";
import LoadingOverlay from "../components/LoadingOverlay";
import { analyzeFile, analyzeUrl, analyzeText } from "../api";

const TABS = ["upload", "url", "text"];

export default function Home() {
  const [activeTab, setActiveTab] = useState("upload");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleFileSelect = async (file) => {
    setError(null);
    setLoading(true);
    try {
      const result = await analyzeFile(file);
      navigate(`/result/${result._id}`);
    } catch (err) {
      setError(err.response?.data?.error || "Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleUrlSubmit = async (url) => {
    setError(null);
    setLoading(true);
    try {
      const result = await analyzeUrl(url);
      navigate(`/result/${result._id}`);
    } catch (err) {
      setError(err.response?.data?.error || "URL analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleTextSubmit = async (text) => {
    setError(null);
    setLoading(true);
    try {
      const result = await analyzeText(text);
      navigate(`/result/${result._id}`);
    } catch (err) {
      setError(err.response?.data?.error || "Text analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const tabLabels = {
    upload: "📁 Upload File",
    url: "🔗 Paste URL",
    text: "✍️ Paste Text",
  };

  return (
    <>
      {loading && <LoadingOverlay />}

      <div className="page-enter max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-600/10 border border-brand-500/20 mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
            <span className="text-xs font-medium text-brand-300 tracking-wider uppercase">
              AI-Powered Verification
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-4">
            <span className="text-white">Detect </span>
            <span className="gradient-text">AI-Generated</span>
            <br />
            <span className="text-white">Content Instantly</span>
          </h1>
          <p className="text-lg text-white/40 max-w-xl mx-auto leading-relaxed">
            Upload images, videos, paste any URL, or enter text — our multi-layered
            analysis engine scores content authenticity in seconds.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex p-1 rounded-xl bg-surface-800/60 border border-white/5">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                  activeTab === tab
                    ? "bg-brand-600 text-white shadow-lg shadow-brand-600/25"
                    : "text-white/40 hover:text-white/70"
                }`}
              >
                {tabLabels[tab]}
              </button>
            ))}
          </div>
        </div>

        {/* Input area */}
        <div className="glass rounded-2xl p-6 sm:p-8">
          {activeTab === "upload" ? (
            <UploadZone onFileSelect={handleFileSelect} disabled={loading} />
          ) : activeTab === "url" ? (
            <UrlInput onSubmit={handleUrlSubmit} disabled={loading} />
          ) : (
            <TextInput onSubmit={handleTextSubmit} disabled={loading} />
          )}
        </div>

        {/* Error display */}
        {error && (
          <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm text-center animate-fade-up">
            ⚠️ {error}
          </div>
        )}

        {/* Feature badges */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[
            { icon: "🔍", title: "Image Analysis", desc: "GAN & deepfake detection" },
            { icon: "📝", title: "Text Credibility", desc: "Clickbait & bias scoring" },
            { icon: "✍️", title: "AI Text Detection", desc: "NVIDIA-powered analysis" },
            { icon: "🌐", title: "Reverse Search", desc: "Cross-reference web sources" },
          ].map((f) => (
            <div
              key={f.title}
              className="glass rounded-xl p-4 text-center hover:border-brand-500/30 transition-all duration-300"
            >
              <div className="text-2xl mb-2">{f.icon}</div>
              <p className="text-sm font-semibold text-white/80">{f.title}</p>
              <p className="text-xs text-white/35 mt-0.5">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
