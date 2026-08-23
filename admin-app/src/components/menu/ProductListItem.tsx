import type { DraggableProvidedDragHandleProps } from '@hello-pangea/dnd';
import type { Product } from '../../api/client';

interface Props {
  product: Product;
  currency: string;
  dragHandleProps?: DraggableProvidedDragHandleProps | null;
  onEdit: () => void;
  onDelete: () => void;
}

export function ProductListItem({ product, currency, dragHandleProps, onEdit, onDelete }: Props) {
  return (
    <>
      <span className="hb-drag-handle" {...dragHandleProps} title="Sürükle">
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
      <span className="hb-badge">
        {product.price} {currency}
      </span>
      <div className="hb-product-row__actions">
        <button type="button" className="button button-small hb-btn-ghost" title="Düzenle" onClick={onEdit}>
          ✎
        </button>
        <button
          type="button"
          className="button button-small hb-btn-ghost hb-btn-danger"
          title="Sil"
          onClick={onDelete}
        >
          ✕
        </button>
      </div>
    </>
  );
}
