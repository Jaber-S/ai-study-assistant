import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export function QuizView({ data, loading, error, onRetry, hasRun }) {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState([]);

  useEffect(() => {
    setCurrentIndex(0);
    setSelectedAnswers(Array.isArray(data) ? Array(data.length).fill(null) : []);
  }, [data]);

  if (!hasRun && !loading) return null;

  if (loading) {
    return (
      <div className="rounded-xl border border-white/10 bg-gray-800/50 p-6">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
          <p className="text-gray-400">{t('generatingQuiz')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-950/30 p-4">
        <p className="text-sm text-red-200">{error}</p>
        <button
          onClick={onRetry}
          className="mt-3 rounded-xl px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-sm transition"
        >
          {t('retry')}
        </button>
      </div>
    );
  }

  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-gray-800/50 p-6">
        <p className="text-gray-400">{t('noQuestions')}</p>
      </div>
    );
  }

  const completed = selectedAnswers.every((answer) => answer !== null);
  const total = data.length;
  const correctCount = selectedAnswers.reduce(
    (sum, answer, idx) => sum + (answer === data[idx]?.answer ? 1 : 0),
    0
  );

  if (completed) {
    return (
      <div className="rounded-xl border border-white/10 bg-gray-800/50 p-6 h-full min-h-0 flex flex-col gap-6 overflow-hidden">
        <div>
          <h2 className="text-xl font-semibold text-white mb-2">{t('quizComplete')}</h2>
          <p className="text-gray-400">{t('yourScore')}</p>
          <p className="text-3xl font-bold text-white mt-2">{correctCount} / {total}</p>
          <p className="text-gray-400">{t('percentageCorrect')} {Math.round((correctCount / total) * 100)}%</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-gray-900/50 p-4 space-y-3 flex-1 min-h-0 overflow-y-auto pr-1">
          {data.map((item, idx) => {
            const selected = selectedAnswers[idx];
            const isCorrect = selected === item.answer;
            return (
              <div key={idx} className="rounded-xl border border-white/10 bg-gray-800/50 p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <p className="text-sm text-gray-400">{t('question')} {idx + 1}</p>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-lg ${isCorrect ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                    {isCorrect ? t('correct') : t('incorrect')}
                  </span>
                </div>
                <p className="text-white mb-2">{item.question}</p>
                <p className="text-sm text-gray-300">{t('correctAnswerWas')} {item.options[item.answer]}</p>
              </div>
            );
          })}
        </div>

        <button
          onClick={() => {
            setCurrentIndex(0);
            setSelectedAnswers(Array(total).fill(null));
          }}
          className="rounded-xl bg-blue-600 hover:bg-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-blue-600/40 hover:shadow-blue-600/60 transition"
        >
          {t('restartQuiz')}
        </button>
      </div>
    );
  }

  const current = data[currentIndex];
  const progress = `${currentIndex + 1} / ${total}`;
  const answered = selectedAnswers[currentIndex] !== null;
  const selected = selectedAnswers[currentIndex];
  const isCorrect = answered && selected === current.answer;

  return (
    <div className="rounded-xl border border-white/10 bg-gray-800/50 p-6 h-full min-h-0 flex flex-col overflow-hidden">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-400">{progress}</span>
        <div className="h-2 flex-1 mx-3 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all"
            style={{ width: `${((currentIndex + 1) / total) * 100}%` }}
          ></div>
        </div>
      </div>

      <div className="mb-6 flex-1 min-h-0 overflow-y-auto pr-1">
        <h3 className="text-lg font-semibold text-white mb-4">{current.question}</h3>

        <div className="space-y-3">
          {current.options?.map((option, idx) => {
            const isOptionCorrect = idx === current.answer;
            const isOptionSelected = selected === idx;
            const optionClass = answered
              ? isOptionCorrect
                ? 'border-green-500 bg-green-500/10 text-green-300'
                : isOptionSelected
                ? 'border-red-500 bg-red-500/10 text-red-300'
                : 'border-white/10 bg-gray-800/30 text-gray-200'
              : 'border-white/10 bg-gray-800/30 text-gray-200 hover:border-blue-500/50';

            return (
              <button
                key={idx}
                onClick={() => {
                  if (answered) return;
                  setSelectedAnswers((prev) => {
                    const next = [...prev];
                    next[currentIndex] = idx;
                    return next;
                  });
                }}
                className={`w-full text-left p-3 rounded-xl border transition ${optionClass}`}
                disabled={answered}
              >
                {option}
              </button>
            );
          })}
        </div>

        {answered && (
          <div className="mt-4 p-3 rounded-xl bg-blue-500/10 border border-blue-500/30">
            <p className="text-sm text-blue-200">
              {isCorrect ? t('answerCorrect') : `${t('answerIncorrect')} ${t('correctAnswerWas')} ${current.options[current.answer]}`}
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
          className="flex-1 rounded-xl px-3 py-2 bg-gray-800/50 hover:bg-gray-800/70 disabled:bg-gray-900/50 disabled:cursor-not-allowed text-white text-sm transition border border-white/10"
        >
          {t('previous')}
        </button>
        <button
          onClick={() => setCurrentIndex(Math.min(total - 1, currentIndex + 1))}
          disabled={currentIndex === total - 1}
          className="flex-1 rounded-xl px-3 py-2 bg-gray-800/50 hover:bg-gray-800/70 disabled:bg-gray-900/50 disabled:cursor-not-allowed text-white text-sm transition border border-white/10"
        >
          {t('next')}
        </button>
      </div>
    </div>
  );
}