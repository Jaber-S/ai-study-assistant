import ReactMarkdown from "react-markdown";
import { QuizInteractive } from "./QuizInteractive.jsx";

const summaryMarkdownClass =
  "text-sm leading-relaxed text-gray-200 " +
  "[&_h1]:font-display [&_h1]:mb-4 [&_h1]:mt-0 [&_h1]:border-b [&_h1]:border-gray-700 [&_h1]:pb-2 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-white " +
  "[&_h2]:mb-2 [&_h2]:mt-6 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-gray-100 [&_h2]:first:mt-0 " +
  "[&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 " +
  "[&_li]:my-1 [&_li]:marker:text-gray-500 " +
  "[&_strong]:font-semibold [&_strong]:text-blue-200 " +
  "[&_em]:italic [&_em]:text-gray-300 " +
  "[&_p]:my-2 [&_p]:text-gray-200";

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-gray-400">
      <div
        className="h-10 w-10 animate-spin rounded-full border-2 border-gray-600 border-t-blue-400"
        aria-hidden
      />
      <p className="text-sm">Working on your sources…</p>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="rounded-xl border border-red-500/30 bg-red-950/40 p-4 text-red-200">
      <p className="font-medium text-red-100">Something went wrong</p>
      <p className="mt-1 text-sm text-red-200/90">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded-xl bg-red-500/20 px-3 py-1.5 text-sm font-medium text-red-100 hover:bg-red-500/30"
        >
          Try again
        </button>
      )}
    </div>
  );
}

function EmptyState({ modeLabel }) {
  return (
    <div className="flex h-full min-h-[200px] flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-gray-900/30 p-8 text-center text-gray-500">
      <p className="font-display text-lg font-semibold text-gray-400">
        Your results appear here
      </p>
      <p className="mt-2 max-w-sm text-sm">
        Add typed notes and/or upload .txt or .pdf on the left, choose{" "}
        <span className="text-gray-400">{modeLabel}</span>, then run the
        assistant.
      </p>
    </div>
  );
}

export function ResultPanel({
  loading,
  error,
  result,
  mode,
  modeLabel,
  onRetry,
  hasRun,
}) {
  const renderSummaryMarkdown = mode === "summary" && Boolean(result);
  const renderQuiz = mode === "quiz" && Boolean(result);
  let quizData = null;
  let quizParseError = "";

  if (renderQuiz) {
    try {
      const parsed = JSON.parse(result);
      if (Array.isArray(parsed) && parsed.length > 0) {
        quizData = parsed;
      } else {
        quizParseError = "Quiz data is invalid. Please try again.";
      }
    } catch {
      quizParseError = "Could not parse quiz data. Please run the quiz again.";
    }
  }

  return (
    <section
      className="flex min-h-0 flex-1 flex-col rounded-xl border border-white/10 bg-gray-800/50 p-4 shadow-xl backdrop-blur-sm lg:p-6"
      aria-live="polite"
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="font-display text-lg font-semibold text-white">
          Result
        </h2>
        {loading && (
          <span className="text-xs font-medium text-blue-400">Loading</span>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading && <LoadingState />}
        {!loading && error && (
          <ErrorState message={error} onRetry={onRetry} />
        )}
        {!loading && !error && !result && !hasRun && (
          <EmptyState modeLabel={modeLabel} />
        )}
        {!loading && !error && !result && hasRun && (
          <p className="text-gray-500">No content returned.</p>
        )}
        {!loading && !error && result && renderSummaryMarkdown && (
          <article className={summaryMarkdownClass}>
            <ReactMarkdown>{result}</ReactMarkdown>
          </article>
        )}
        {!loading && !error && result && renderQuiz && quizData && (
          <QuizInteractive quiz={quizData} />
        )}
        {!loading && !error && result && renderQuiz && !quizData && (
          <ErrorState message={quizParseError} onRetry={onRetry} />
        )}
        {!loading && !error && result && !renderSummaryMarkdown && !renderQuiz && (
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-200">
            {result}
          </pre>
        )}
      </div>
    </section>
  );
}
