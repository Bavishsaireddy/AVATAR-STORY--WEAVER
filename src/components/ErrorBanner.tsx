"use client";

import { motion } from "framer-motion";

interface ErrorBannerProps {
  error: string;
  onDismiss: () => void;
  className?: string;
}

export default function ErrorBanner({ error, onDismiss, className = "" }: ErrorBannerProps) {
  return (
    <motion.div
      layout
      role="alert"
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, transition: { duration: 0.2 } }}
      transition={{ type: "spring", stiffness: 420, damping: 34 }}
      className={`mx-4 sm:mx-6 mt-3 flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 shadow-sm shadow-zinc-200/50 ${className}`}
    >
      <motion.span
        className="text-red-600 text-lg shrink-0"
        aria-hidden
        initial={{ scale: 0.6 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 22 }}
      >
        ⚠
      </motion.span>
      <div className="flex-1 min-w-0">
        <p className="text-red-800 text-sm leading-relaxed">{error}</p>
      </div>
      <motion.button
        type="button"
        onClick={onDismiss}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="text-red-600 hover:text-red-800 text-sm shrink-0 transition-colors"
      >
        ✕
      </motion.button>
    </motion.div>
  );
}
