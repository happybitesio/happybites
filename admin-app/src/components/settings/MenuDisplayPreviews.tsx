import type { ReactNode } from 'react';

type EntryMode = 'direct' | 'categories';
type ViewMode = 'list' | 'bento';
type ListStyle = 'classic' | 'compact' | 'card';
type CategoryNavMode = 'tabs' | 'scroll';
type HeaderStyle = 'classic' | 'centered';

function PreviewFrame({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`hb-display-preview ${className}`.trim()} aria-hidden>
      {children}
    </div>
  );
}

export function MenuEntryPreview({ variant }: { variant: EntryMode }) {
  if (variant === 'categories') {
    return (
      <PreviewFrame className="hb-display-preview--entry-categories">
        <div className="hb-display-preview__category-grid">
          <span />
          <span />
          <span />
          <span />
        </div>
      </PreviewFrame>
    );
  }

  return (
    <PreviewFrame className="hb-display-preview--entry-direct">
      <div className="hb-display-preview__tabs">
        <span className="is-active" />
        <span />
        <span />
      </div>
      <div className="hb-display-preview__product-rows">
        <span />
        <span />
        <span />
      </div>
    </PreviewFrame>
  );
}

export function MenuViewPreview({ variant }: { variant: ViewMode }) {
  if (variant === 'bento') {
    return (
      <PreviewFrame className="hb-display-preview--view-bento">
        <div className="hb-display-preview__bento">
          <span className="is-featured" />
          <span />
          <span />
          <span className="is-wide" />
        </div>
      </PreviewFrame>
    );
  }

  return (
    <PreviewFrame className="hb-display-preview--view-list">
      <div className="hb-display-preview__list-rows">
        <span />
        <span />
        <span />
      </div>
    </PreviewFrame>
  );
}

export function ListStylePreview({ variant }: { variant: ListStyle }) {
  return (
    <PreviewFrame className={`hb-display-preview--list-${variant}`}>
      <div className="hb-display-preview__list-item">
        <span className="hb-display-preview__thumb" />
        <span className="hb-display-preview__copy">
          <span className="hb-display-preview__line hb-display-preview__line--title" />
          {variant !== 'compact' ? <span className="hb-display-preview__line hb-display-preview__line--desc" /> : null}
          {variant === 'card' ? <span className="hb-display-preview__line hb-display-preview__line--meta" /> : null}
        </span>
        {variant === 'compact' ? <span className="hb-display-preview__price" /> : null}
      </div>
    </PreviewFrame>
  );
}

export function CategoryNavPreview({ variant }: { variant: CategoryNavMode }) {
  if (variant === 'scroll') {
    return (
      <PreviewFrame className="hb-display-preview--nav-scroll">
        <div className="hb-display-preview__section">
          <span className="hb-display-preview__heading" />
          <span className="hb-display-preview__mini-row" />
          <span className="hb-display-preview__mini-row" />
        </div>
        <div className="hb-display-preview__section">
          <span className="hb-display-preview__heading" />
          <span className="hb-display-preview__mini-row" />
        </div>
      </PreviewFrame>
    );
  }

  return (
    <PreviewFrame className="hb-display-preview--nav-tabs">
      <div className="hb-display-preview__tabs">
        <span className="is-active" />
        <span />
        <span />
      </div>
      <div className="hb-display-preview__single-section">
        <span className="hb-display-preview__mini-row" />
        <span className="hb-display-preview__mini-row" />
        <span className="hb-display-preview__mini-row" />
      </div>
    </PreviewFrame>
  );
}

export function HeaderStylePreview({ variant }: { variant: HeaderStyle }) {
  if (variant === 'centered') {
    return (
      <PreviewFrame className="hb-display-preview--header-centered">
        <span className="hb-display-preview__header-logo hb-display-preview__header-logo--round" />
        <span className="hb-display-preview__line hb-display-preview__line--title hb-display-preview__header-line" />
        <span className="hb-display-preview__header-badge" />
        <span className="hb-display-preview__header-glass" />
      </PreviewFrame>
    );
  }

  return (
    <PreviewFrame className="hb-display-preview--header-classic">
      <div className="hb-display-preview__header-row">
        <span className="hb-display-preview__header-logo" />
        <span className="hb-display-preview__copy">
          <span className="hb-display-preview__line hb-display-preview__line--title" />
          <span className="hb-display-preview__line hb-display-preview__line--meta" />
        </span>
      </div>
      <span className="hb-display-preview__line hb-display-preview__line--desc" />
      <div className="hb-display-preview__header-pills">
        <span />
        <span />
      </div>
    </PreviewFrame>
  );
}
