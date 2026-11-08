import React, { useEffect, useRef, useState } from 'react';

interface NumericFieldProps {
  value: number;
  onCommit: (value: number) => void | boolean;
  ariaLabel: string;
  step?: number;
  min?: number;
  max?: number;
  integer?: boolean;
  className?: string;
  placeholder?: string;
}

/** Sem barra nem botões de incremento: digitação, setas e scroll do mouse. */
export const NumericField: React.FC<NumericFieldProps> = ({
  value, onCommit, ariaLabel, step = 1, min = 0, max = Number.MAX_SAFE_INTEGER,
  integer = false, className = '', placeholder,
}) => {
  const [draft, setDraft] = useState(String(value));
  const input = useRef<HTMLInputElement>(null);
  const latest = useRef({ draft, onCommit, min, max, step, integer, value });
  latest.current = { draft, onCommit, min, max, step, integer, value };

  useEffect(() => setDraft(String(value)), [value]);

  const numeric = (raw: string): number => Number(raw.trim().replace(',', '.'));
  const commit = (raw: string) => {
    const n = numeric(raw);
    if (!raw.trim() || !Number.isFinite(n) || n < min || n > max || (integer && !Number.isSafeInteger(n))) {
      setDraft(String(value));
      return;
    }
    const aceito = onCommit(n);
    setDraft(aceito === false ? String(value) : String(n));
  };

  useEffect(() => {
    const node = input.current;
    if (!node) return;
    const wheel = (event: WheelEvent) => {
      event.preventDefault(); // não move a página enquanto ajusta um valor
      const opts = latest.current;
      const parsed = Number(opts.draft.trim().replace(',', '.'));
      const base = Number.isFinite(parsed) && opts.draft.trim() ? parsed : opts.value;
      const next = Math.min(opts.max, Math.max(opts.min,
        Math.round((base + (event.deltaY < 0 ? opts.step : -opts.step)) * 100) / 100
      ));
      const resultado = opts.integer ? Math.round(next) : next;
      const aceito = opts.onCommit(resultado);
      setDraft(aceito === false ? String(opts.value) : String(resultado));
    };
    node.addEventListener('wheel', wheel, { passive: false });
    return () => node.removeEventListener('wheel', wheel);
  }, []);

  return (
    <input
      ref={input}
      type="text"
      inputMode={integer ? 'numeric' : 'decimal'}
      aria-label={ariaLabel}
      value={draft}
      placeholder={placeholder}
      onChange={event => setDraft(event.target.value.replace(/[^0-9.,-]/g, ''))}
      onBlur={() => commit(draft)}
      onKeyDown={event => {
        if (event.key === 'Enter') event.currentTarget.blur();
        if (event.key === 'Escape') { setDraft(String(value)); event.currentTarget.blur(); }
        if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
          event.preventDefault();
          const current = numeric(draft);
          const base = Number.isFinite(current) ? current : value;
          const next = Math.min(max, Math.max(min,
            Math.round((base + (event.key === 'ArrowUp' ? step : -step)) * 100) / 100
          ));
          const resultado = integer ? Math.round(next) : next;
          const aceito = onCommit(resultado);
          setDraft(aceito === false ? String(value) : String(resultado));
        }
      }}
      title="Digite qualquer valor válido ou use o scroll do mouse para ajustar"
      className={className || 'w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-mono text-emerald-300 outline-none focus:border-emerald-500'}
    />
  );
};
