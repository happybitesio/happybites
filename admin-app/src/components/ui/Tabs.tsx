import type { ReactNode } from 'react';

interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
}

interface Props {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
  variant?: 'segmented' | 'underline';
}

export function Tabs({ tabs, active, onChange, variant = 'segmented' }: Props) {
  return (
    <nav className={`hb-tabs hb-tabs--${variant}`} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          className={`hb-tabs__item${active === tab.id ? ' is-active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.icon && <span className="hb-tabs__icon" aria-hidden>{tab.icon}</span>}
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
