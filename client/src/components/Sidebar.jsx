import { useTranslation } from 'react-i18next';
import { SourceUpload } from "./SourceUpload.jsx";
import { LanguageSwitcher } from "./LanguageSwitcher.jsx";
import { Trash2, LogOut } from 'lucide-react';

export function Sidebar({ disabled, parsing, uploads, onFilesSelected, onRemoveUpload, text, setText, sourceError, onReset, userName, onSignOut }) {
  const { t } = useTranslation();

  return (
    <aside className="w-80 bg-[#0d0d0d] border-r border-white/10 h-screen hidden md:flex flex-col backdrop-blur-sm">
      {/* Logo Section */}
      <div className="p-6 border-b border-white/5">
        <div className="flex items-start justify-between gap-4">
          <img src="/VibeStudy_banner.png" alt="VibeStudy Banner" className="h-14" />
          {userName && (
            <button
              type="button"
              onClick={onSignOut}
              className="text-slate-300 hover:text-white transition"
              title="Cerrar sesión"
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
        {userName ? (
          <div className="mt-5 rounded-2xl bg-slate-950/80 border border-white/10 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-sky-300">Bienvenido</p>
            <p className="mt-2 text-lg font-semibold text-white">{userName}</p>
          </div>
        ) : (
          <p className="mt-5 text-sm text-gray-400">Inicia sesión para acceder a tu dashboard.</p>
        )}
      </div>

      {/* Language Switcher */}
      <div className="p-6 border-b border-white/5">
        <LanguageSwitcher />
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">{t('sources')}</h2>
        <SourceUpload
          disabled={disabled}
          parsing={parsing}
          uploads={uploads}
          onFilesSelected={onFilesSelected}
          onRemoveUpload={onRemoveUpload}
        />
        {sourceError && (
          <p className="mt-4 rounded-lg border border-red-500/30 bg-red-950/30 px-3 py-2 text-sm text-red-200" role="alert">
            {sourceError}
          </p>
        )}
        <div className="mt-6">
          <label htmlFor="notes" className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 block">
            {t('additionalNotes')}
          </label>
          <textarea
            id="notes"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={disabled}
            placeholder={t('pasteOrWrite')}
            className="w-full h-32 resize-none rounded-xl border border-white/10 bg-gray-800/50 px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:border-blue-500/50 focus:outline-none"
          />
        </div>
      </div>

      <div className="mt-6 pt-4 px-6 pb-6 border-t border-white/5">
        <button
          onClick={onReset}
          disabled={disabled}
          className="flex items-center gap-3 text-gray-500 hover:text-red-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg hover:bg-red-500/10"
          title="Borrar todos los datos"
        >
          <Trash2 size={18} />
          <span className="text-base font-medium">Reset</span>
        </button>
      </div>
    </aside>
  );
}