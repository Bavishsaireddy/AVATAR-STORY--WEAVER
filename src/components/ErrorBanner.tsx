"use client";

interface ErrorBannerProps {
  error: string;
  onDismiss: () => void;
}

export default function ErrorBanner({ error, onDismiss }: ErrorBannerProps) {
  return (
    <div className="mx-4 sm:mx-6 mt-3 flex items-start gap-3 bg-red-950/60 border border-red-500/30 rounded-xl px-4 py-3">
      <span className="text-red-400 text-lg shrink-0">⚠</span>
      <div className="flex-1 min-w-0">
        <p className="text-red-300 text-sm leading-relaxed">{error}</p>
      </div>
      <button
        onClick={onDismiss}
        className="text-red-500 hover:text-red-300 text-sm shrink-0 transition"
      >
        ✕
      </button>
    </div>
  );
}
