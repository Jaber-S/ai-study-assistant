import { useCallback, useRef, useState } from "react";
import { useTranslation } from 'react-i18next';
import { isSupportedExtension } from "../utils/extractFileText.js";

export function SourceUpload({
  disabled,
  parsing,
  uploads,
  onFilesSelected,
  onRemoveUpload,
}) {
  const { t } = useTranslation();
  const inputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);

  const openPicker = () => inputRef.current?.click();

  const filterFiles = useCallback((fileList) => {
    const out = [];
    for (const file of fileList) {
      if (isSupportedExtension(file.name)) out.push(file);
    }
    return out;
  }, []);

  const handleChange = (e) => {
    const files = e.target.files;
    if (files?.length) onFilesSelected(filterFiles(files));
    e.target.value = "";
  };

  const onDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !parsing) setDragActive(true);
  };

  const onDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (disabled || parsing) return;
    if (e.dataTransfer.files?.length) {
      onFilesSelected(filterFiles(e.dataTransfer.files));
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
        {t('uploadSources')}
      </p>
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={[
          "rounded-xl border border-dashed px-4 py-4 transition-colors",
          dragActive
            ? "border-blue-400 bg-blue-500/10"
            : "border-gray-600 bg-gray-950/40",
          disabled || parsing ? "pointer-events-none opacity-50" : "",
        ].join(" ")}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.txt,application/pdf,text/plain"
          multiple
          className="sr-only"
          aria-label="Upload PDF or text files"
          onChange={handleChange}
          disabled={disabled || parsing}
        />
        <div className="flex flex-col items-center gap-2 text-center sm:flex-row sm:justify-between sm:text-left">
          <p className="text-sm text-gray-400">
            {t('dragDropText')}
          </p>
          <button
            type="button"
            onClick={openPicker}
            disabled={disabled || parsing}
            className="shrink-0 rounded-xl border border-white/10 bg-gray-800/50 px-4 py-2 text-sm font-medium text-gray-200 hover:border-blue-500/50 hover:bg-gray-800/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50"
          >
            {parsing ? t('reading') : t('chooseFiles')}
          </button>
        </div>
      </div>

      {uploads.length > 0 && (
        <ul className="space-y-2" aria-label="Uploaded sources">
          {uploads.map((u) => (
            <li
              key={u.id}
              className="flex items-start justify-between gap-2 rounded-xl border border-white/10 bg-gray-800/30 px-3 py-2 text-sm"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-gray-200">{u.name}</p>
                <p className="text-xs text-gray-500">
                  {u.text.length.toLocaleString()} characters extracted
                </p>
              </div>
              <button
                type="button"
                onClick={() => onRemoveUpload(u.id)}
                disabled={disabled || parsing}
                className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-red-400 hover:bg-red-950/50 focus:outline-none focus-visible:ring-1 focus-visible:ring-red-500 disabled:opacity-40"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
