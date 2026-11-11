'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-[#FAF7F2] text-[#2C1810] p-6 flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
        <p className="text-xs text-[#7A6B63] mb-4">
          {error?.message || 'An unexpected application error occurred.'}
        </p>
        <button
          onClick={() => reset()}
          className="px-5 py-2.5 bg-[#2C1810] text-[#FAF7F2] rounded-xl font-bold text-xs hover:bg-[#1A0E0A] cursor-pointer"
        >
          Try Again
        </button>
      </body>
    </html>
  );
}
