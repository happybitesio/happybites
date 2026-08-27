import type { DraggableProvidedDragHandleProps } from '@hello-pangea/dnd';
import type { Product } from '../../api/client';
import { t } from '../../i18n';

interface Props {
  product: Product;
  currency: string;
  dragHandleProps?: DraggableProvidedDragHandleProps | null;
  dragDisabled?: boolean;
  selected: boolean;
  onToggleSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMove: () => void;
  onToggleStatus: () => void;
}

export function ProductListItem({
  product,
  currency,
  dragHandleProps,
  dragDisabled,
  selected,
  onToggleSelect,
  onEdit,
  onDelete,
  onMove,
  onToggleStatus,
}: Props) {
  const isDraft = product.status === 'draft';

  return (
    <>
      <input
        type="checkbox"
        className="hb-row-check"
        checked={selected}
        onChange={onToggleSelect}
        aria-label={t('menu.selectProduct')}
      />
      <span
        className={`hb-drag-handle${dragDisabled ? ' is-disabled' : ''}`}
        {...dragHandleProps}
        title={t('menu.drag')}
      >
        ⠿
      </span>
      <div className="hb-product-row__thumb" aria-hidden>
        {product.image ? (
          <img src={product.image} alt="" />
        ) : (
          <span className="hb-product-row__thumb-empty">🍽️</span>
        )}
      </div>
      <span className="hb-product-row__title">{product.title}</span>
      <button
        type="button"
        className={`hb-status-pill${isDraft ? ' hb-status-pill--draft' : ''}`}
        title={isDraft ? t('menu.statusToPublish') : t('menu.statusToDraft')}
        onClick={onToggleStatus}
      >
        {isDraft ? t('menu.draftBadge') : t('menu.publishBadge')}
      </button>
      <span className="hb-badge">
        {product.price} {currency}
      </span>
      <div className="hb-product-row__actions">
        <button type="button" className="button button-small hb-btn-ghost hb-icon-btn" title={t('menu.moveTo')} onClick={onMove}>
          ⤷
        </button>
        <button type="button" className="button button-small hb-btn-ghost hb-icon-btn" title={t('menu.edit')} onClick={onEdit}>
          ✎
        </button>
        <button
          type="button"
          className="button button-small hb-btn-ghost hb-btn-danger hb-icon-btn"
          title={t('menu.delete')}
          onClick={onDelete}
        >
          ✕
        </button>
      </div>
    </>
  );
}
