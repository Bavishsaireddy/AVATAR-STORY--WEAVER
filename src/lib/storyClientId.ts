"use client";

import { v4 as uuidv4 } from "uuid";

const STORAGE_KEY = "story-weaver-client-id";

export function getOrCreateStoryClientId(): string {
  if (typeof window === "undefined" || !window.localStorage || typeof window.localStorage.getItem !== "function") return "";
  try {
    let id = window.localStorage.getItem(STORAGE_KEY);
    if (!id || id.length < 8) {
      id = uuidv4();
      window.localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  } catch {
    return "";
  }
}

export function storyPersistenceHeaders(): HeadersInit {
  const id = getOrCreateStoryClientId();
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (id) h["X-Story-Client-Id"] = id;
  return h;
}
