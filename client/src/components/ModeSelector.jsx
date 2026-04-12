import { useTranslation } from 'react-i18next';

const MODES = [
  { id: "chat", label: "chat" },
  { id: "summary", label: "summary" },
  { id: "quiz", label: "quiz" },
  { id: "flashcards", label: "flashcards" },
];

export function ModeSelector({ value, onChange, disabled }) {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
        {t('mode')}
      </p>
      <div
        className="flex flex-wrap gap-2"
        role="tablist"
        aria-label="AI processing mode"
      >
        {MODES.map((m) => {
          const active = value === m.id;
          return (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={active}
              disabled={disabled}
              onClick={() => onChange(m.id)}
              className={[
                "rounded-xl px-4 py-2 text-sm font-medium transition",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#121212]",
                active
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/50 backdrop-blur-sm"
                  : "bg-gray-800/50 text-gray-300 hover:bg-gray-800/70 hover:text-white",
                disabled ? "opacity-50 pointer-events-none" : "",
              ].join(" ")}
            >
              {t(m.label)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { MODES };
