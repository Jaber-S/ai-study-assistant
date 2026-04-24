import { useCallback, useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { requestAi } from '../api/aiClient.js';
import { ModeSelector } from '../components/ModeSelector.jsx';
import { Sidebar } from '../components/Sidebar.jsx';
import { FloatingInput } from '../components/FloatingInput.jsx';
import { SummaryView } from '../components/SummaryView.jsx';
import { QuizView } from '../components/QuizView.jsx';
import { FlashcardsView } from '../components/FlashcardsView.jsx';
import { ChatView } from '../components/ChatView.jsx';
import UserMenu from '../components/UserMenu.jsx';
import { NotebookSelector } from '../components/NotebookSelector.jsx';
import { NotebookHeader } from '../components/NotebookHeader.jsx';
import { useNotebooks } from '../context/NotebookContext.jsx';
import { buildStudyMaterialText } from '../utils/buildStudyMaterial.js';
import { extractTextFromFile } from '../utils/extractFileText.js';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabaseClient.js';

const loadFromStorage = (key, defaultValue) => {
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;

    const parsed = JSON.parse(item);

    if (key === 'chatMessages' && Array.isArray(parsed)) {
      return parsed.map(msg => ({
        ...msg,
        timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
      }));
    }

    return parsed;
  } catch (error) {
    console.warn(`Error loading ${key} from localStorage:`, error);
    return defaultValue;
  }
};

const saveToStorage = (key, value) => {
  try {
    if (key === 'chatMessages' && Array.isArray(value)) {
      const serialized = value.map(msg => ({
        ...msg,
        timestamp: msg.timestamp ? msg.timestamp.toISOString() : new Date().toISOString(),
      }));
      localStorage.setItem(key, JSON.stringify(serialized));
    } else {
      localStorage.setItem(key, JSON.stringify(value));
    }
  } catch (error) {
    if (error.name === 'QuotaExceededError') {
      alert('No hay suficiente espacio en localStorage. Por favor, elimina algunas fuentes para liberar espacio.');
    } else {
      console.warn(`Error saving ${key} to localStorage:`, error);
    }
  }
};

export default function Dashboard({ user }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    activeNotebookId,
    activeNotebook,
    lastCreatedNotebookId,
    clearLastCreatedNotebookId,
    addSource,
    isLoading: notebooksLoading,
    updateSummaryData,
    updateQuizData,
    updateFlashcardsData,
  } = useNotebooks();
  const [text, setText] = useState(() => loadFromStorage('text', ''));
  const [uploads, setUploads] = useState(() => {
    // When component mounts, load uploads from active notebook if available
    return [];
  });
  const [parsingFiles, setParsingFiles] = useState(false);
  const [mode, setMode] = useState(() => loadFromStorage('mode', 'chat'));
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sourceError, setSourceError] = useState('');
  const [summaryData, setSummaryData] = useState(() => loadFromStorage('summaryData', ''));
  const [animateSummary, setAnimateSummary] = useState(false);
  const [quizData, setQuizData] = useState(() => loadFromStorage('quizData', []));
  const [flashcardsData, setFlashcardsData] = useState(() => loadFromStorage('flashcardsData', []));
  const [chatMessages, setChatMessages] = useState(() => loadFromStorage('chatMessages', []));
  const [hasRun, setHasRun] = useState(() => {
    const hasSummary = loadFromStorage('summaryData', '').length > 0;
    const hasQuiz = loadFromStorage('quizData', []).length > 0;
    const hasFlashcards = loadFromStorage('flashcardsData', []).length > 0;
    const hasChat = loadFromStorage('chatMessages', []).length > 0;
    return hasSummary || hasQuiz || hasFlashcards || hasChat;
  });
  const [headerCollapsed, setHeaderCollapsed] = useState(false);

  // Load notebook data when active notebook changes
  useEffect(() => {
    if (activeNotebook) {
      setUploads(activeNotebook.sources || []);
      setText('');
      setSummaryData(activeNotebook.summaryData || '');
      setAnimateSummary(false);
      setQuizData(activeNotebook.quizData || []);
      setFlashcardsData(activeNotebook.flashcardsData || []);
      setChatMessages(activeNotebook.chatHistory || []);
      setHasRun((activeNotebook.chatHistory?.length || 0) > 0 || (activeNotebook.summaryData?.length || 0) > 0);

      // Header behavior:
      // - Newly created notebook: expand so user can name it.
      // - Existing notebook (re-enter): collapsed by default.
      const shouldExpand = activeNotebook.id === lastCreatedNotebookId;
      setHeaderCollapsed(!shouldExpand);
      if (shouldExpand) {
        clearLastCreatedNotebookId();
      }
    }
  }, [activeNotebook?.id]);

  useEffect(() => {
    if (mode !== 'summary' && summaryData) {
      setAnimateSummary(false);
    }
  }, [mode, summaryData]);

  const displayName = user?.user_metadata?.full_name || user?.email || 'Estudiante';

  useEffect(() => saveToStorage('text', text), [text]);
  useEffect(() => {
    // Only save uploads to localStorage if no active notebook
    if (!activeNotebookId) {
      saveToStorage('uploads', uploads);
    }
  }, [uploads, activeNotebookId]);
  useEffect(() => saveToStorage('mode', mode), [mode]);
  useEffect(() => {
    saveToStorage('summaryData', summaryData);
    if (activeNotebookId) {
      updateSummaryData(activeNotebookId, summaryData);
    }
  }, [summaryData, activeNotebookId, updateSummaryData]);
  useEffect(() => {
    saveToStorage('quizData', quizData);
    if (activeNotebookId) {
      updateQuizData(activeNotebookId, quizData);
    }
  }, [quizData, activeNotebookId, updateQuizData]);
  useEffect(() => {
    saveToStorage('flashcardsData', flashcardsData);
    if (activeNotebookId) {
      updateFlashcardsData(activeNotebookId, flashcardsData);
    }
  }, [flashcardsData, activeNotebookId, updateFlashcardsData]);
  useEffect(() => {
    // Save chat messages to both localStorage and active notebook
    saveToStorage('chatMessages', chatMessages);
    if (activeNotebook && activeNotebookId) {
      // The notebook context handles this internally
    }
  }, [chatMessages, activeNotebook, activeNotebookId]);
  useEffect(() => saveToStorage('hasRun', hasRun), [hasRun]);

  const resetAllData = useCallback(() => {
    const confirmed = window.confirm(
      '¿Estás seguro de que quieres reiniciar los resultados generados? Esta acción eliminará el historial de chat, resúmenes, quizzes y flashcards de forma permanente. Las fuentes permanecerán intactas.'
    );


    if (confirmed) {
      setSummaryData('');
      setAnimateSummary(false);
      setQuizData([]);
      setFlashcardsData([]);
      setChatMessages([]);
      setError('');
      setSourceError('');
      setHasRun(false);
      localStorage.removeItem('summaryData');
      localStorage.removeItem('quizData');
      localStorage.removeItem('flashcardsData');
      localStorage.removeItem('chatMessages');
      localStorage.removeItem('hasRun');
    }
  }, []);

  const combinedText = useMemo(() => buildStudyMaterialText(text, uploads), [text, uploads]);
  const hasMaterial = combinedText.trim() !== '';

  const canSubmit = useMemo(() => {
    if (!combinedText.trim()) return false;
    if (mode === 'chat' && !question.trim()) return false;
    return true;
  }, [combinedText, mode, question]);

  const handleFilesSelected = useCallback(
    async (files) => {
      if (!files.length || loading || parsingFiles) return;
      setParsingFiles(true);
      setSourceError('');

      try {
        const nextUploads = [];
        for (const file of files) {
          const raw = await extractTextFromFile(file);
          const trimmed = raw.trim();
          if (!trimmed) {
            throw new Error(`“${file.name}” has no extractable text. Try another file or paste the text instead.`);
          }
          const uploadObj = { id: crypto.randomUUID(), name: file.name, text: trimmed };
          nextUploads.push(uploadObj);
          
          // If active notebook, save source to it
          if (activeNotebook && activeNotebookId) {
            addSource(activeNotebookId, uploadObj);
          }
        }
        setUploads((prev) => [...prev, ...nextUploads]);
      } catch (err) {
        setSourceError(err instanceof Error ? err.message : 'Could not read file.');
      } finally {
        setParsingFiles(false);
      }
    },
    [loading, parsingFiles, activeNotebook, activeNotebookId, addSource]
  );

  const removeUpload = useCallback((id) => setUploads((prev) => prev.filter((u) => u.id !== id)), []);

  const run = useCallback(async () => {
    if (!canSubmit || loading) return;
    setLoading(true);
    setError('');
    setHasRun(true);

    if (mode === 'chat') {
      setChatMessages((prev) => [...prev, { role: 'user', content: question, timestamp: new Date() }]);
      setQuestion('');
    }

    try {
      const out = await requestAi({ text: combinedText.trim(), mode, question: mode === 'chat' ? question.trim() : undefined });

      if (mode === 'summary') {
        setAnimateSummary(true);
        setSummaryData(out);
      } else if (mode === 'quiz') {
        setQuizData(out);
      } else if (mode === 'flashcards') {
        setFlashcardsData(out);
      } else if (mode === 'chat') {
        setChatMessages((prev) => [...prev, { role: 'assistant', content: out, timestamp: new Date() }]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [canSubmit, loading, combinedText, mode, question]);

  const retry = useCallback(() => { if (canSubmit) run(); }, [canSubmit, run]);

  const busy = loading || parsingFiles;

  // Show notebook selector if no active notebook or notebooks still loading
  if (notebooksLoading) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent mx-auto mb-3"></div>
          <p className="text-gray-400">{t('loadingNotebooks') || 'Loading notebooks...'}</p>
        </div>
      </div>
    );
  }

  if (!activeNotebookId) {
    return <NotebookSelector user={user} />;
  }

  return (
    <div className="h-screen bg-[#0d0d0d] text-white flex flex-col overflow-hidden">
      <NotebookHeader isCollapsed={headerCollapsed} onCollapsedChange={setHeaderCollapsed} />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          disabled={busy}
          parsing={parsingFiles}
          uploads={uploads}
          onFilesSelected={handleFilesSelected}
          onRemoveUpload={removeUpload}
          text={text}
          setText={setText}
          sourceError={sourceError}
          onReset={resetAllData}
        />
        <main className="flex-1 bg-[#121212] p-6 h-full flex flex-col overflow-hidden">
          <div className="max-w-5xl w-full mx-auto h-full flex flex-col">
            <div className="flex justify-end mb-6">
              <UserMenu user={user} />
            </div>
            <div className="flex flex-col flex-1 min-h-0">
              <ModeSelector value={mode} onChange={setMode} disabled={busy} />
              <div className="mt-6 flex-1 min-h-0 flex flex-col max-h-screen">
                <div className="flex-1 min-h-0 overflow-y-auto">
                  {mode === 'summary' && (
                    <SummaryView
                      data={summaryData}
                      loading={loading}
                      error={error}
                      onRetry={retry}
                      hasRun={hasRun}
                      animateOnMount={animateSummary}
                      onAnimationComplete={() => setAnimateSummary(false)}
                    />
                  )}
                  {mode === 'quiz' && <QuizView data={quizData} loading={loading} error={error} onRetry={retry} hasRun={hasRun} />}
                  {mode === 'flashcards' && <FlashcardsView data={flashcardsData} loading={loading} error={error} onRetry={retry} hasRun={hasRun} />}
                  {mode === 'chat' && <ChatView messages={chatMessages} loading={loading} error={error} onRetry={retry} hasRun={hasRun} />}
                </div>
                <div className="mt-auto flex justify-center pb-4">
                  {mode === 'chat' ? (
                    <FloatingInput mode={mode} question={question} setQuestion={setQuestion} onSubmit={run} disabled={busy || !combinedText.trim()} hasMaterial={hasMaterial} />
                  ) : (
                    <button
                      type="button"
                      onClick={run}
                      disabled={!canSubmit || busy}
                      className="rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600/50 px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-blue-600/40 hover:shadow-blue-600/60 transition disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {hasMaterial
                        ? (loading
                          ? t('processing')
                          : `${t('generate') || 'Generar'} ${(t(mode) || mode).toLowerCase()}`)
                        : t('uploadOrWrite')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
