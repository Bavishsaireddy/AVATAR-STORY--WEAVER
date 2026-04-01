"use client";

import HomePage from "@/components/HomePage";

/** Static import so Safari (and strict networks) don’t hang on a lazy chunk forever. */
export default function StoryWeaverClientRoot() {
  return <HomePage />;
}
