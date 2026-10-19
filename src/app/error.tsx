"use client";

import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
        <svg viewBox="0 0 24 24" className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 8v5M12 16.5v.5M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h1 className="mt-4 font-display text-2xl font-extrabold">Something went wrong</h1>
      <p className="mt-2 text-sm text-neutral-500">
        An unexpected error occurred. Please try again, or contact us on WhatsApp if the problem continues.
      </p>
      <button onClick={reset} className="mt-6 rounded-xl bg-neutral-900 px-6 py-3 text-sm font-bold text-white hover:bg-red-700">
        Try Again
      </button>
    </div>
  );
}
