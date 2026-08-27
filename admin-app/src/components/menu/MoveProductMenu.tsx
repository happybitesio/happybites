import { useEffect, useState } from 'react';
import type { Category } from '../../api/client';
import { t } from '../../i18n';

export type MovePosition = 'start' | 'end';

interface Props {
  categories: Category[];
  /** Number of products being moved (1 for the row action, more for bulk). */
  count: number;
  /** Category the (single) product currently lives in; 0 = uncategorized. */
  currentCategoryId?: number;
  onMove: (targetCategoryId: number, position: MovePosition) => void;
  /** Reorder inside the current category; only offered for single products. */
  onMoveWithin?: (edge: 'top' | 'bottom') => void;
  onClose: () => void;
}

interface FlatCategory {
  id: number;
  name: string;
  depth: number;
}

function flatten(categories: Category[]): FlatCategory[] {
  const out: FlatCategory[] = [];

  for (const category of categories) {
    out.push({ id: category.id, name: category.name, depth: 0 });
    for (const sub of category.subcategories) {
      out.push({ id: sub.id, name: sub.name, depth: 1 });
    }
  }

  return out;
}

export function MoveProductMenu({ categories, count, currentCategoryId, onMove, onMoveWithin, onClose }: Props) {
  const [position, setPosition] = useState<MovePosition>('end');
  const [query, setQuery] = useState('');

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const flat = flatten(categories);
  const normalized = query.trim().toLowerCase();
  const visible = normalized ? flat.filter((c) => c.name.toLowerCase().includes(normalized)) : flat;

  return (
    <div className="hb-modal-backdrop" onClick={onClose}>
      <div
        className="hb-modal hb-modal--compact hb-move-menu"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="move-menu-title"
      >
        <div className="hb-modal__head">
          <div className="hb-modal__head-text">
            <h2 id="move-menu-title">{t('menu.moveToTitle')}</h2>
            <p className="hb-modal__subtitle">{t('menu.moveToDesc', { count })}</p>
          </div>
          <button type="button" className="hb-modal__close" onClick={onClose} aria-label={t('common.close')}>
            ×
          </button>
        </div>

        <div className="hb-modal__body">
          {onMoveWithin && (
            <div className="hb-move-menu__quick">
              <button type="button" className="button" onClick={() => onMoveWithin('top')}>
                ↑ {t('menu.moveTop')}
              </button>
              <button type="button" className="button" onClick={() => onMoveWithin('bottom')}>
                ↓ {t('menu.moveBottom')}
              </button>
            </div>
          )}

          <div className="hb-move-menu__position" role="radiogroup" aria-label={t('menu.movePosition')}>
            <button
              type="button"
              className={`button${position === 'start' ? ' button-primary' : ''}`}
              onClick={() => setPosition('start')}
            >
              {t('menu.positionStart')}
            </button>
            <button
              type="button"
              className={`button${position === 'end' ? ' button-primary' : ''}`}
              onClick={() => setPosition('end')}
            >
              {t('menu.positionEnd')}
            </button>
          </div>

          <input
            className="hb-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('menu.moveSearchPlaceholder')}
            autoFocus
          />

          <div className="hb-move-menu__list">
            {visible.map((category) => (
              <button
                key={category.id}
                type="button"
                className="hb-move-menu__item"
                style={{ paddingLeft: `${12 + category.depth * 20}px` }}
                onClick={() => onMove(category.id, position)}
              >
                {category.depth > 0 && <span className="hb-move-menu__branch">└</span>}
                <span className="hb-move-menu__name">{category.name}</span>
                {category.id === currentCategoryId && (
                  <span className="hb-badge hb-badge--muted">{t('menu.currentCategory')}</span>
                )}
              </button>
            ))}
            <button type="button" className="hb-move-menu__item" onClick={() => onMove(0, position)}>
              <span className="hb-move-menu__name hb-move-menu__name--muted">{t('menu.uncategorizedTitle')}</span>
              {currentCategoryId === 0 && <span className="hb-badge hb-badge--muted">{t('menu.currentCategory')}</span>}
            </button>
            {visible.length === 0 && normalized !== '' && <p className="hb-empty">{t('menu.moveNoResults')}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
