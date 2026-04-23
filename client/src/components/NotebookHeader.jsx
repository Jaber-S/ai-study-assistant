import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Check } from 'lucide-react';
import { useNotebooks } from '../context/NotebookContext';

/**
 * SaveToast - Visual feedback when notebook is saved
 */
function SaveToast({ show }) {
  if (!show) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium animate-pulse">
      <Check className="w-4 h-4" />
      {/* Automatically fadeout after animation */}
    </div>
  );
}

/**
 * NotebookHeader - Header showing active notebook with editable title
 */
export function NotebookHeader() {
  const { t } = useTranslation();
  const { activeNotebook, setActiveNotebookId, updateNotebookMetadata } = useNotebooks();
  const [editTitle, setEditTitle] = useState(activeNotebook?.title || '');
  const [isSaved, setIsSaved] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Update editTitle when activeNotebook changes
  useEffect(() => {
    if (activeNotebook) {
      setEditTitle(activeNotebook.title);
      setHasChanges(false);
    }
  }, [activeNotebook?.id]);

  // Handle title change
  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setEditTitle(newTitle);
    setHasChanges(newTitle !== activeNotebook.title);
  };

  // Save notebook metadata
  const handleSave = () => {
    if (activeNotebook && editTitle.trim() && editTitle !== activeNotebook.title) {
      updateNotebookMetadata(activeNotebook.id, {
        title: editTitle.trim()
      });
      setHasChanges(false);
      setIsSaved(true);
      setShowSaveToast(true);

      // Hide toast after 2 seconds
      setTimeout(() => {
        setShowSaveToast(false);
      }, 2000);

      // Reset saved state
      setTimeout(() => {
        setIsSaved(false);
      }, 2500);
    }
  };

  // Back to notebook selector
  const handleBack = () => {
    if (hasChanges) {
      const confirmed = window.confirm(
        t('unsavedChanges') || '¿Tienes cambios sin guardar. ¿Quieres salir?'
      );
      if (!confirmed) return;
    }
    setActiveNotebookId(null);
  };

  // Save on Enter key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && hasChanges) {
      handleSave();
    }
  };

  if (!activeNotebook) return null;

  return (
    <>
      <SaveToast show={showSaveToast} />
      
      <div className="border-b border-white/10 bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Back button */}
            <button
              onClick={handleBack}
              className="flex-shrink-0 p-2 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
              title={t('back') || 'Volver'}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            {/* Editable title */}
            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={editTitle}
                onChange={handleTitleChange}
                onKeyPress={handleKeyPress}
                className="w-full text-xl font-bold text-white bg-transparent border-0 border-b-2 border-transparent hover:border-blue-500/50 focus:border-blue-500 focus:outline-none transition-colors px-0 py-1"
                placeholder={t('notebookTitle') || 'Título del cuaderno'}
              />
              {activeNotebook.description && (
                <p className="text-xs text-gray-400 mt-1">{activeNotebook.description}</p>
              )}
            </div>

            {/* Save button */}
            <button
              onClick={handleSave}
              disabled={!hasChanges || !editTitle.trim()}
              className={`flex-shrink-0 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                isSaved
                  ? 'bg-green-600 text-white'
                  : hasChanges
                  ? 'bg-blue-600 hover:bg-blue-500 text-white'
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
              title={hasChanges ? t('save') : t('noChanges')}
            >
              {isSaved ? (
                <>
                  <Check className="w-4 h-4 inline mr-1" />
                  {t('saved') || 'Guardado'}
                </>
              ) : (
                t('save') || 'Guardar'
              )}
            </button>
          </div>

          {/* Info row */}
          <div className="flex gap-6 mt-4 text-xs text-gray-500 px-0">
            <span>📄 {activeNotebook.sources.length} {t('sources') || 'fuentes'}</span>
            <span>💬 {activeNotebook.chatHistory.length} {t('messages') || 'mensajes'}</span>
            <span>📅 {new Date(activeNotebook.createdAt).toLocaleDateString('es-ES')}</span>
          </div>
        </div>
      </div>
    </>
  );
}
