"use client"; // Error components must be Client Components

interface CustomError extends Error {
  errMessage: string;
}

export default function Error({
  error,
  reset,
}: {
  error: CustomError;
  reset?: () => void;
}) {
  return (
    <section className="feedback-page" role="alert">
      <div className="feedback-card">
          <span className="eyebrow">Something went wrong</span>
          <h1>{error?.errMessage || "We could not load this page"}</h1>
          <p>Please try again. Your previous action has not been discarded.</p>
          <button className="btn btn-primary-roomi" onClick={() => reset?.()}>
            Try again
          </button>
      </div>
    </section>
  );
}
