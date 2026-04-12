import { useTranslation } from 'react-i18next';
import { SourceUpload } from "./SourceUpload.jsx";
import { LanguageSwitcher } from "./LanguageSwitcher.jsx";
import { Trash2 } from 'lucide-react';

export function Sidebar({ disabled, parsing, uploads, onFilesSelected, onRemoveUpload, text, setText, sourceError, onReset }) {
  const { t } = useTranslation();

  return (
    <aside className="w-80 bg-[#0d0d0d] border-r border-white/10 h-screen hidden md:flex flex-col backdrop-blur-sm">
      {/* Logo Section */}
      <div className="p-6 border-b border-white/5">
        <img src="/VibeStudy_banner.png" alt="VibeStudy Banner" className="h-14" />
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