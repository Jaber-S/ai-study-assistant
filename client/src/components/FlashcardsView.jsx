import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export function FlashcardsView({ data, loading, error, onRetry, hasRun }) {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  if (!hasRun && !loading) return null;

  if (loading) {
    return (
      <div className="rounded-xl border border-white/10 bg-gray-800/50 p-6">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
          <p className="text-gray-400">{t('generatingFlashcards')}</p>
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
        <p className="text-gray-400">{t('noFlashcards')}</p>
      </div>
    );
  }

  const current = data[currentIndex];
  const progress = `${currentIndex + 1} / ${data.length}`;

  return (
    <div className="rounded-xl border border-white/10 bg-gray-800/50 p-6 h-full min-h-0 overflow-y-auto">
      <div className="mb-6 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-400">{progress}</span>
        <div className="h-2 flex-1 mx-3 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all"
            style={{ width: `${((currentIndex + 1) / data.length) * 100}%` }}
          ></div>
        </div>
      </div>

      <div
        onClick={() => setIsFlipped(!isFlipped)}
        className="h-64 cursor-pointer relative mb-6"
      >
        <div
          className={`w-full h-full rounded-xl border-2 flex items-center justify-center transition-all duration-300 ${
            isFlipped
              ? 'bg-blue-600/15 border-blue-500/50 shadow-lg shadow-blue-600/20'
              : 'bg-gray-800/50 border-white/10 hover:border-white/20'
          }`}
        >
          <div className="text-center p-6">
            <p className="text-xs text-gray-400 mb-3 uppercase tracking-widest font-bold">
              {isFlipped ? t('answer') : t('question')}
            </p>
            <p className="text-xl font-semibold text-white leading-relaxed">
              {isFlipped ? current.back : current.front}
            </p>
            <p className="text-xs text-gray-500 mt-4">{t('clickToFlip')}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => {
            setCurrentIndex(Math.max(0, currentIndex - 1));
            setIsFlipped(false);
          }}
          disabled={currentIndex === 0}
          className="flex-1 rounded-xl px-3 py-2 bg-gray-800/50 hover:bg-gray-800/70 disabled:bg-gray-900/50 disabled:cursor-not-allowed text-white text-sm transition border border-white/10"
        >
          {t('previous')}
        </button>
        <button
          onClick={() => {
            setCurrentIndex(Math.min(data.length - 1, currentIndex + 1));
            setIsFlipped(false);
          }}
          disabled={currentIndex === data.length - 1}
          className="flex-1 rounded-xl px-3 py-2 bg-gray-800/50 hover:bg-gray-800/70 disabled:bg-gray-900/50 disabled:cursor-not-allowed text-white text-sm transition border border-white/10"
        >
          {t('next')}
        </button>
      </div>

      <div className="mt-4 flex justify-center">
        <button
          onClick={() => {
            setCurrentIndex(0);
            setIsFlipped(false);
          }}
          className="rounded-xl px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm transition shadow-lg shadow-blue-600/40 hover:shadow-blue-600/60"
        >
          {t('restart')}
        </button>
      </div>
    </div>
  );
}