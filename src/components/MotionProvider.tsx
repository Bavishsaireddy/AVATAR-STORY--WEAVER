"use client";

import { MotionConfig } from "framer-motion";

/**
 * Honors `prefers-reduced-motion` for all Framer Motion descendants.
 */
export default function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
