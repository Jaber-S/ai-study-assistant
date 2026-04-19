import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { MarkdownRenderer } from './MarkdownRenderer';

// Function to strip markdown and get plain text
function stripMarkdown(text) {
  return text
    .replace(/#{1,6}\s*/g, '') // Remove headers
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
    .replace(/\*(.*?)\*/g, '$1') // Remove italic
    .replace(/`([^`]+)`/g, '$1') // Remove inline code
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Remove links, keep text
    .replace(/^\s*[-*+]\s+/gm, '') // Remove list markers
    .replace(/^\s*\d+\.\s+/gm, '') // Remove numbered list markers
    .replace(/\n\s*\n/g, '\n') // Remove extra newlines
    .trim();
}

export function SummaryView({ data, loading, error, onRetry, hasRun }) {
  const { t } = useTranslation();
  const [displayedData, setDisplayedData] = useState('');

  // Stream text effect
  useEffect(() => {
    if (!data) {
      setDisplayedData('');
      return;
    }

    let currentIndex = 0;
    const fullData = data;
    
    // Reset displayed data when new data arrives
    setDisplayedData('');
    
    const interval = setInterval(() => {
      currentIndex += 15; // Show 15 characters at a time
      
      if (currentIndex >= fullData.length) {
        currentIndex = fullData.length;
        clearInterval(interval);
      }

      setDisplayedData(fullData.substring(0, currentIndex));
    }, 50); // Update every 50ms (slower than before for better readability)

    return () => clearInterval(interval);
  }, [data]);

  const handleCopy = async () => {
    const plainText = stripMarkdown(data);
    try {
      await navigator.clipboard.writeText(plainText);
      // Optional: show a toast or something
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  if (!hasRun && !loading) return null;

  if (loading) {
    return (
      <div className="rounded-xl border border-white/10 bg-gray-800/50 p-6">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
          <p className="text-gray-400">{t('generatingSummary')}</p>
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

  if (!data) return null;

  return (
    <div className="w-full h-full flex flex-col rounded-xl border border-white/10 bg-gray-800/50">
      <div className="flex-1 min-h-0 overflow-y-auto p-6">
        <MarkdownRenderer content={displayedData} />
      </div>
      <div className="border-t border-white/10 p-4 flex justify-end flex-shrink-0">
        <button
          onClick={handleCopy}
          className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-1"
          title="Copy plain text"
        >
          📋 Copy
        </button>
      </div>
    </div>
  );
}