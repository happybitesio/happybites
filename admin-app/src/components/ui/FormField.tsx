import type { ReactNode } from 'react';

interface Props {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}

export function FormField({ label, hint, children, className = '' }: Props) {
  return (
    <div className={`hb-field ${className}`.trim()}>
      <label className="hb-field__label">{label}</label>
      <div className="hb-field__control">{children}</div>
      {hint && <p className="hb-field__hint">{hint}</p>}
    </div>
  );
}
