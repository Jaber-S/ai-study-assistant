import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

export function ChatView({ messages, loading, error, onRetry, hasRun }) {
  const { t } = useTranslation();
  const messagesEndRef = useRef(null);
  const [displayedMessages, setDisplayedMessages] = useState([]);
  const lastMessageIdRef = useRef(null);

  // Initialize displayed messages with full content on mount
  useEffect(() => {
    setDisplayedMessages(messages.map(msg => ({
      ...msg,
      displayedContent: msg.content
    })));
    lastMessageIdRef.current = null;
  }, [messages]); // Sync whenever messages changes (not just length)

  // Animate only the last assistant message
  useEffect(() => {
    if (messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    
    // Only animate if it's an assistant message and hasn't been animated yet
    if (lastMessage.role !== 'assistant' || lastMessageIdRef.current === lastMessage.content) {
      return;
    }

    let currentIndex = 0;
    const fullContent = lastMessage.content;
    lastMessageIdRef.current = fullContent;
    
    // Start with empty for animation
    setDisplayedMessages(prev => {
      const newMessages = [...prev];
      newMessages[newMessages.length - 1] = {
        ...newMessages[newMessages.length - 1],
        displayedContent: ''
      };
      return newMessages;
    });

    const interval = setInterval(() => {
      currentIndex += 15; // Show 15 characters at a time
      
      if (currentIndex >= fullContent.length) {
        currentIndex = fullContent.length;
        clearInterval(interval);
      }

      setDisplayedMessages(prev => {
        if (prev.length === 0) return prev;
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = {
          ...newMessages[newMessages.length - 1],
          displayedContent: fullContent.substring(0, currentIndex)
        };
        return newMessages;
      });
    }, 50); // Update every 50ms (slower streaming)

    return () => clearInterval(interval);
  }, [messages]); // Depend on messages, read last message from here (source of truth)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayedMessages]);

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  if (!hasRun && !loading) return null;

  if (error && displayedMessages.length === 0) {
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

  return (
    <div className="rounded-xl border border-white/10 bg-gray-800/50 p-6 h-full min-h-0 overflow-y-auto flex flex-col">
      {displayedMessages.length === 0 ? (
        <div className="flex items-center justify-center h-32">
          <p className="text-gray-400 text-center">
            {t('chatPlaceholder')}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedMessages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`rounded-lg px-4 py-2 max-w-lg ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-200'
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {msg.displayedContent}
                </p>
                <p className="text-xs mt-1 opacity-70">
                  {msg.timestamp && new Date(msg.timestamp).toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
                {msg.role === 'assistant' && (
                  <div className="mt-2 flex justify-end">
                    <button
                      onClick={() => handleCopy(msg.content)}
                      className="text-xs text-gray-400 hover:text-gray-200 transition-colors"
                      title="Copy text"
                    >
                      📋
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-700 text-gray-200 rounded-lg px-4 py-2">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  );
}