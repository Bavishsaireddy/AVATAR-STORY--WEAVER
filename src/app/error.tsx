"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-zinc-50 px-6 text-center">
      <h1 className="text-lg font-semibold text-zinc-900">Something went wrong</h1>
      <p className="text-sm text-zinc-600 max-w-md">
        The story UI hit an unexpected error. This sometimes happens after a bad network response. Try again, or run{" "}
        <code className="rounded bg-zinc-200 px-1.5 py-0.5 text-xs">npm run dev</code> for clearer errors.
      </p>
      {error?.message ? (
        <details className="text-left max-w-lg w-full text-xs text-zinc-500">
          <summary className="cursor-pointer text-zinc-600">Error detail</summary>
          <pre className="mt-2 whitespace-pre-wrap break-words rounded bg-zinc-100 p-3 text-zinc-800 font-mono">
            {error.message}
          </pre>
        </details>
      ) : null}
      <button
        type="button"
        onClick={() => reset()}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
      >
        Try again
      </button>
    </div>
  );
}
