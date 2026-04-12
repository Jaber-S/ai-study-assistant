import { useState } from "react";

function getOptionClass({ isSelected, isCorrect, isWrong, isDisabled }) {
  const base =
    "w-full rounded-2xl border px-4 py-4 text-left text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950";
  if (isCorrect) {
    return `${base} border-emerald-400 bg-emerald-500/10 text-emerald-100 shadow-sm shadow-emerald-500/10`;
  }
  if (isWrong) {
    return `${base} border-rose-400 bg-rose-500/10 text-rose-100 shadow-sm shadow-rose-500/10 animate-shake`;
  }
  if (isSelected) {
    return `${base} border-blue-400 bg-blue-500/10 text-gray-100`;
  }
  return `${base} border-gray-700 bg-gray-950/70 text-gray-200 hover:border-gray-500 hover:bg-gray-900/90`;
}

export function QuizInteractive({ quiz }) {
  const total = Array.isArray(quiz) ? quiz.length : 0;
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  if (!Array.isArray(quiz) || total === 0) {
    return (
      <div className="rounded-3xl border border-gray-800 bg-gray-900/80 p-6 shadow-xl animate-fade-in">
        <p className="text-sm text-gray-400">
          The quiz data is unavailable or invalid. Try running the assistant again.
        </p>
      </div>
    );
  }

  const currentQuestion = quiz[currentQuestionIndex];
  const hasAnswered = selectedOption !== null;
  const isCorrect = hasAnswered && selectedOption === currentQuestion.answer;
  const progressPercentage = Math.round(((currentQuestionIndex + 1) / total) * 100);
  const buttonLabel = currentQuestionIndex + 1 === total ? "Finish Quiz" : "Next Question";

  const handleSelect = (optionIndex) => {
    if (showFeedback || isFinished) return;
    setSelectedOption(optionIndex);
    setShowFeedback(true);
    if (optionIndex === currentQuestion.answer) {
      setScore((value) => value + 1);
    }
  };

  const handleNext = () => {
    if (!showFeedback) return;
    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex >= total) {
      setIsFinished(true);
      return;
    }
    setCurrentQuestionIndex(nextIndex);
    setSelectedOption(null);
    setShowFeedback(false);
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setShowFeedback(false);
    setScore(0);
    setIsFinished(false);
  };

  if (isFinished) {
    return (
      <div className="rounded-3xl border border-gray-800 bg-gray-900/80 p-6 shadow-xl animate-fade-in">
        <div className="mb-6 rounded-3xl border border-gray-800 bg-gray-950/70 p-6 text-center">
          <p className="text-sm uppercase tracking-wide text-gray-500">
            Quiz complete
          </p>
          <p className="mt-4 text-3xl font-semibold text-white">
            You scored {score} / {total}
          </p>
          <p className="mt-2 text-sm text-gray-400">
            Great work! Review the material or restart the quiz to try again.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRestart}
          className="w-full rounded-2xl bg-blue-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Restart Quiz
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-gray-800 bg-gray-900/80 p-6 shadow-xl animate-fade-in">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">
            Question {currentQuestionIndex + 1} / {total}
          </p>
          <p className="mt-2 text-sm text-gray-400">{currentQuestion.question}</p>
        </div>
        <div className="flex-1">
          <div className="h-2 overflow-hidden rounded-full bg-gray-800">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-3">
        {currentQuestion.options.map((option, index) => {
          const isSelected = index === selectedOption;
          const isCorrectOption = index === currentQuestion.answer;
          const isWrongSelected = showFeedback && isSelected && !isCorrectOption;

          return (
            <button
              key={option + index}
              type="button"
              onClick={() => handleSelect(index)}
              disabled={showFeedback}
              className={getOptionClass({
                isSelected,
                isCorrect: showFeedback && isCorrectOption,
                isWrong: isWrongSelected,
              })}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold text-gray-100">{String.fromCharCode(65 + index)}.</span>
                <span className="text-left text-sm text-gray-200">{option}</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex flex-col gap-4">
        {showFeedback && (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
              isCorrect
                ? "border-emerald-400 bg-emerald-500/10 text-emerald-100"
                : "border-rose-400 bg-rose-500/10 text-rose-100"
            }`}
          >
            {isCorrect ? "Correct ✔️" : "Incorrect ❌"}
            {showFeedback && !isCorrect && (
              <span className="block text-gray-400 mt-1 text-xs">
                The right answer is {String.fromCharCode(65 + currentQuestion.answer)}.
              </span>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={handleNext}
          disabled={!showFeedback}
          className="w-full rounded-2xl bg-blue-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  );
}
