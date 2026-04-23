import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, BookOpen, Trash2, ChevronRight, Sparkles } from 'lucide-react';
import { useNotebooks } from '../context/NotebookContext';
import UserMenu from './UserMenu.jsx';

/**
 * NotebookSelection - Grid interface to create, select, or delete notebooks
 * Shown when no active notebook is selected
 */
export function NotebookSelector({ user }) {
  const { t } = useTranslation();
  const {
    notebooks,
    createNotebook,
    deleteNotebook,
    setActiveNotebookId
  } = useNotebooks();

  const [deletingId, setDeletingId] = useState(null);

  const handleCreateNotebook = () => {
    createNotebook(
      t('newNotebook') || 'Nuevo Cuaderno',
      t('createNewNotebook') || 'Cuaderno creado automáticamente'
    );
  };

  const handleSelectNotebook = (notebookId) => {
    setActiveNotebookId(notebookId);
  };

  const handleDeleteNotebook = (notebookId) => {
    deleteNotebook(notebookId);
    setDeletingId(null);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-8 flex flex-col">
      {/* User Menu - Top Right */}
      <div className="flex justify-end mb-8">
        <UserMenu user={user} />
      </div>

      <div className="max-w-7xl mx-auto flex-1">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-blue-600/20 border border-blue-500/30">
              <BookOpen className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">VibeStudy</h1>
              <p className="text-gray-400 text-sm mt-1">
                {t('selectNotebook') || 'Selecciona un cuaderno o crea uno nuevo'}
              </p>
            </div>
          </div>
          {notebooks.length > 0 && (
            <p className="text-gray-500 text-sm ml-14">
              {notebooks.length} {notebooks.length === 1 ? 'cuaderno' : 'cuadernos'} disponibles
            </p>
          )}
        </div>

        {/* Grid de cuadernos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* Crear nuevo cuaderno - Primera tarjeta */}
          <button
            onClick={handleCreateNotebook}
            className="h-64 rounded-2xl border-2 border-dashed border-blue-500/50 hover:border-blue-400 bg-gradient-to-br from-blue-500/10 to-blue-600/5 hover:from-blue-500/20 hover:to-blue-600/15 flex flex-col items-center justify-center gap-4 transition-all duration-300 group hover:shadow-lg hover:shadow-blue-500/20"
          >
            <div className="p-4 rounded-full bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors">
              <Plus className="w-8 h-8 text-blue-400 group-hover:text-blue-300 transition-colors" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-blue-300 group-hover:text-blue-200 transition-colors">
                {t('newNotebook') || 'Crear cuaderno'}
              </h3>
              <p className="text-xs text-gray-500 mt-2">
                {t('createNewNotebook') || 'Nuevo cuaderno de estudio'}
              </p>
            </div>
          </button>

          {/* Tarjetas de cuadernos existentes */}
          {notebooks.map((notebook) => (
            <div
              key={notebook.id}
              className={`relative h-64 rounded-2xl border transition-all duration-300 group overflow-hidden ${
                deletingId === notebook.id
                  ? 'border-red-500/50 bg-red-950/30'
                  : 'border-white/10 bg-gradient-to-br from-gray-800/50 to-gray-900/50 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/20'
              }`}
            >
              {/* Fondo con efecto glow */}
              {deletingId !== notebook.id && (
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent pointer-events-none" />
                </div>
              )}

              {deletingId === notebook.id ? (
                // Modo eliminar
                <div className="h-full p-4 flex flex-col items-center justify-center gap-4">
                  <Sparkles className="w-6 h-6 text-red-400" />
                  <p className="text-sm text-red-200 text-center">
                    {t('confirmDelete') || '¿Eliminar cuaderno?'}
                  </p>
                  <div className="flex gap-2 w-full">
                    <button
                      onClick={() => handleDeleteNotebook(notebook.id)}
                      className="flex-1 px-2 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition"
                    >
                      {t('delete') || 'Eliminar'}
                    </button>
                    <button
                      onClick={() => setDeletingId(null)}
                      className="flex-1 px-2 py-1 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-xs font-semibold transition"
                    >
                      {t('cancel') || 'Cancelar'}
                    </button>
                  </div>
                </div>
              ) : (
                // Modo normal
                <div
                  onClick={() => handleSelectNotebook(notebook.id)}
                  className="h-full p-5 flex flex-col justify-between cursor-pointer relative z-10"
                >
                  {/* Contenido */}
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors line-clamp-2">
                      {notebook.title}
                    </h3>
                    {notebook.description && (
                      <p className="text-xs text-gray-400 mt-2 line-clamp-2">
                        {notebook.description}
                      </p>
                    )}
                  </div>

                  {/* Estadísticas */}
                  <div className="space-y-2 mt-4 pt-4 border-t border-white/10">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>📄 {notebook.sources.length}</span>
                      <span>💬 {notebook.chatHistory.length}</span>
                    </div>
                    <p className="text-xs text-gray-600">
                      {formatDate(notebook.createdAt)}
                    </p>
                  </div>

                  {/* Botones overlay en hover */}
                  <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectNotebook(notebook.id);
                      }}
                      className="p-2 rounded-lg bg-blue-600/80 hover:bg-blue-500 text-white transition backdrop-blur-sm"
                      title={t('open') || 'Abrir'}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingId(notebook.id);
                      }}
                      className="p-2 rounded-lg bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white transition backdrop-blur-sm"
                      title={t('delete') || 'Eliminar'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Mensaje si no hay cuadernos */}
        {notebooks.length === 0 && (
          <div className="mt-12 text-center">
            <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4 opacity-50" />
            <p className="text-gray-400 text-lg">
              {t('noNotebooks') || 'Sin cuadernos aún. ¡Crea uno para empezar!'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
