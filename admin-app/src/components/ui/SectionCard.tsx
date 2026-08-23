import type { ReactNode } from 'react';

interface Props {
  title: string;
  description?: string;
  children: ReactNode;
}

export function SectionCard({ title, description, children }: Props) {
  return (
    <section className="hb-section">
      <div className="hb-section__head">
        <h2 className="hb-section__title">{title}</h2>
        {description && <p className="hb-section__desc">{description}</p>}
      </div>
      <div className="hb-section__body">{children}</div>
    </section>
  );
}
