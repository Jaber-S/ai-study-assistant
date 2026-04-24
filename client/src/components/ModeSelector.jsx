import { useTranslation } from 'react-i18next';

const MODES = [
  { id: "chat", label: "chat" },
  { id: "summary", label: "summary" },
  { id: "quiz", label: "quiz" },
  { id: "flashcards", label: "flashcards" },
];

export function ModeSelector({ value, onChange, disabled }) {
  const { t } = useTranslation();
  const activeIndex = Math.max(
    0,
    MODES.findIndex((m) => m.id === value)
  );

  return (
    <div className="w-full">
      <p className="sr-only">{t('mode')}</p>

      <div
        className={[
          'relative w-full rounded-2xl border border-white/10 bg-gray-800/40 backdrop-blur-sm p-1',
          disabled ? 'opacity-60' : '',
        ].join(' ')}
        role="tablist"
        aria-label="AI processing mode"
      >
        <div
          className="absolute top-1 bottom-1 left-1 rounded-xl bg-blue-600/40 transition-transform duration-300 ease-out"
          style={{
            width: 'calc((100% - 0.5rem) / 4)',
            transform: `translateX(${activeIndex * 100}%)`,
          }}
        />

        <div className="relative z-10 grid grid-cols-4">
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
                  'rounded-xl py-2 text-sm font-semibold transition-colors',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#121212]',
                  active
                    ? 'text-white'
                    : 'text-gray-300 hover:text-white',
                  disabled ? 'pointer-events-none' : '',
                ].join(' ')}
              >
                {t(m.label)}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export { MODES };
