import { useCallback, useState } from "react";

export default function UploadZone({ onFileSelect, disabled }) {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState(null);

  const handleFile = useCallback(
    (file) => {
      if (!file) return;
      const isValid =
        file.type.startsWith("image/") || file.type.startsWith("video/");
      if (!isValid) {
        alert("Please upload an image or video file.");
        return;
      }
      if (file.type.startsWith("image/")) {
        setPreview(URL.createObjectURL(file));
      } else {
        setPreview(null);
      }
      onFileSelect(file);
    },
    [onFileSelect]
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files[0];
      handleFile(file);
    },
    [handleFile]
  );

  const handleChange = (e) => {
    const file = e.target.files[0];
    handleFile(file);
  };

  return (
    <div
      className={`dropzone rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-300 ${
        dragActive ? "active" : ""
      } ${disabled ? "opacity-50 pointer-events-none" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={handleDrop}
      onClick={() => document.getElementById("file-input").click()}
    >
      <input
        id="file-input"
        type="file"
        className="hidden"
        accept="image/*,video/*"
        onChange={handleChange}
      />

      {preview ? (
        <div className="space-y-4">
          <img
            src={preview}
            alt="Preview"
            className="mx-auto max-h-48 rounded-xl object-contain border border-white/10"
          />
          <p className="text-sm text-white/50">Click or drop to replace</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-brand-600/10 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-brand-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
          </div>
          <div>
            <p className="text-lg font-semibold text-white/80">
              Drop your file here
            </p>
            <p className="text-sm text-white/40 mt-1">
              or <span className="text-brand-400 underline">browse</span> — images & videos up to 50MB
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
