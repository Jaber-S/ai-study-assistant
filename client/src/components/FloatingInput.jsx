import { useTranslation } from 'react-i18next';

export function FloatingInput({ mode, question, setQuestion, onSubmit, disabled, hasMaterial }) {
  const { t } = useTranslation();

  const handleSubmit = () => {
    if (question.trim() && !disabled) {
      onSubmit();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (mode !== "chat") return null;

  const placeholder = hasMaterial ? t('placeholder') : t('uploadOrWrite');

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-3 flex items-center shadow-lg shadow-blue-500/20">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="flex-1 bg-transparent px-2 py-1 text-sm text-gray-200 placeholder-gray-500 focus:outline-none resize-none h-16 overflow-y-auto"
          disabled={disabled}
        />
        <button
          onClick={handleSubmit}
          disabled={disabled || !question.trim()}
          className="ml-3 bg-blue-500 hover:bg-blue-400 disabled:bg-gray-600 text-white p-2 rounded-lg transition-colors duration-200 shadow-lg shadow-blue-500/40 hover:shadow-blue-500/70 flex-shrink-0 disabled:shadow-none"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
  );
}