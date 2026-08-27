import { useEffect, useRef, useState } from 'react';
import { Draggable, Droppable, type DraggableProvidedDragHandleProps } from '@hello-pangea/dnd';
import type { Category, Product } from '../../api/client';
import { t } from '../../i18n';
import { ProductListItem } from './ProductListItem';

export interface ProductRowHandlers {
  currency: string;
  selectedIds: Set<number>;
  onToggleSelect: (id: number) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onMove: (product: Product) => void;
  onToggleStatus: (product: Product) => void;
}

interface Props {
  category: Category;
  isSub?: boolean;
  /** Only main categories are draggable; subs get no handle. */
  dragHandleProps?: DraggableProvidedDragHandleProps | null;
  expandedIds: Set<number>;
  onToggleExpand: (id: number) => void;
  /** True when a search query or status filter is active. */
  filtering: boolean;
  matchesProduct: (product: Product) => boolean;
  row: ProductRowHandlers;
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (category: Category) => void;
  onAddSubcategory?: (category: Category) => void;
  onAddProduct: (categoryId: number) => void;
  onSortProducts: (categoryId: number, by: 'name' | 'price') => void;
  onSelectCategory: (category: Category, select: boolean) => void;
}

function collectDeepProducts(category: Category): Product[] {
  const products = [...category.products];
  for (const sub of category.subcategories) {
    products.push(...collectDeepProducts(sub));
  }
  return products;
}

export function CategoryBlock({
  category,
  isSub = false,
  dragHandleProps,
  expandedIds,
  onToggleExpand,
  filtering,
  matchesProduct,
  row,
  onEditCategory,
  onDeleteCategory,
  onAddSubcategory,
  onAddProduct,
  onSortProducts,
  onSelectCategory,
}: Props) {
  const deepProducts = collectDeepProducts(category);
  const deepMatches = filtering ? deepProducts.filter(matchesProduct) : deepProducts;

  // While filtering, categories without matches disappear entirely and the
  // ones with matches open automatically.
  if (filtering && deepMatches.length === 0) {
    return null;
  }

  const isOpen = filtering || expandedIds.has(category.id);
  const visibleProducts = filtering ? category.products.filter(matchesProduct) : category.products;
  const allSelected = deepMatches.length > 0 && deepMatches.every((p) => row.selectedIds.has(p.id));

  return (
    <div className={isSub ? 'hb-subcategory' : 'hb-category-block'}>
      <div className={`hb-category-header${isSub ? ' hb-category-header--sub' : ''}`}>
        {dragHandleProps !== undefined && (
          <span className="hb-drag-handle" {...dragHandleProps} title={t('menu.drag')}>
            ⠿
          </span>
        )}
        <button
          type="button"
          className={`hb-chevron${isOpen ? ' is-open' : ''}`}
          onClick={() => onToggleExpand(category.id)}
          aria-expanded={isOpen}
          title={isOpen ? t('menu.collapse') : t('menu.expand')}
        >
          ▸
        </button>
        <input
          type="checkbox"
          className="hb-row-check"
          checked={allSelected}
          onChange={(e) => onSelectCategory(category, e.target.checked)}
          title={t('menu.selectAll')}
        />
        <Droppable droppableId={`cathead-${category.id}`} type="PRODUCT" isDropDisabled={filtering}>
          {(dropProvided, dropSnapshot) => (
            <div
              ref={dropProvided.innerRef}
              {...dropProvided.droppableProps}
              className={`hb-category-header__zone${dropSnapshot.isDraggingOver ? ' is-over' : ''}`}
              onClick={() => onToggleExpand(category.id)}
            >
              <span className="hb-category-header__title">{category.name}</span>
              <span className="hb-cat-count">{deepProducts.length}</span>
              {dropSnapshot.isDraggingOver && (
                <span className="hb-badge">{t('menu.dropHere')}</span>
              )}
              <span className="hb-dnd-hidden">{dropProvided.placeholder}</span>
            </div>
          )}
        </Droppable>
        <div className="hb-category-header__actions">
          <button
            type="button"
            className="button button-small"
            title={t('menu.addProduct')}
            onClick={() => onAddProduct(category.id)}
          >
            {t('menu.addProductBtn')}
          </button>
          {onAddSubcategory && (
            <button
              type="button"
              className="button button-small"
              title={t('menu.addSubcategory')}
              onClick={() => onAddSubcategory(category)}
            >
              {t('menu.addSubcategoryBtn')}
            </button>
          )}
          <button
            type="button"
            className="button button-small hb-icon-btn"
            title={t('menu.edit')}
            onClick={() => onEditCategory(category)}
          >
            ✎
          </button>
          <HeaderMenu
            onSortByName={() => onSortProducts(category.id, 'name')}
            onSortByPrice={() => onSortProducts(category.id, 'price')}
            onDelete={() => onDeleteCategory(category)}
          />
        </div>
      </div>

      {isOpen && (
        <div className="hb-category-body">
          <Droppable droppableId={`products-${category.id}`} type="PRODUCT" isDropDisabled={filtering}>
            {(dropProvided) => (
              <div ref={dropProvided.innerRef} {...dropProvided.droppableProps}>
                {visibleProducts.length === 0 && category.subcategories.length === 0 && (
                  <p className="hb-empty">{t('menu.emptyCategory')}</p>
                )}
                {visibleProducts.map((product, productIndex) => (
                  <Draggable
                    key={product.id}
                    draggableId={`prod-${product.id}`}
                    index={productIndex}
                    isDragDisabled={filtering}
                  >
                    {(productDrag) => (
                      <div
                        ref={productDrag.innerRef}
                        {...productDrag.draggableProps}
                        className={`hb-product-row${row.selectedIds.has(product.id) ? ' is-selected' : ''}${product.status === 'draft' ? ' is-draft' : ''}`}
                      >
                        <ProductListItem
                          product={product}
                          currency={row.currency}
                          dragHandleProps={productDrag.dragHandleProps}
                          dragDisabled={filtering}
                          selected={row.selectedIds.has(product.id)}
                          onToggleSelect={() => row.onToggleSelect(product.id)}
                          onEdit={() => row.onEdit(product)}
                          onDelete={() => row.onDelete(product)}
                          onMove={() => row.onMove(product)}
                          onToggleStatus={() => row.onToggleStatus(product)}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {dropProvided.placeholder}
              </div>
            )}
          </Droppable>

          {category.subcategories.map((sub) => (
            <CategoryBlock
              key={sub.id}
              category={sub}
              isSub
              expandedIds={expandedIds}
              onToggleExpand={onToggleExpand}
              filtering={filtering}
              matchesProduct={matchesProduct}
              row={row}
              onEditCategory={onEditCategory}
              onDeleteCategory={onDeleteCategory}
              onAddProduct={onAddProduct}
              onSortProducts={onSortProducts}
              onSelectCategory={onSelectCategory}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface HeaderMenuProps {
  onSortByName: () => void;
  onSortByPrice: () => void;
  onDelete: () => void;
}

function HeaderMenu({ onSortByName, onSortByPrice, onDelete }: HeaderMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handler = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const run = (action: () => void) => {
    setOpen(false);
    action();
  };

  return (
    <div className="hb-header-menu" ref={rootRef}>
      <button
        type="button"
        className="button button-small hb-icon-btn"
        title={t('menu.moreActions')}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        ⋯
      </button>
      {open && (
        <div className="hb-header-menu__popover" role="menu">
          <button type="button" role="menuitem" onClick={() => run(onSortByName)}>
            {t('menu.sortByName')}
          </button>
          <button type="button" role="menuitem" onClick={() => run(onSortByPrice)}>
            {t('menu.sortByPrice')}
          </button>
          <div className="hb-header-menu__divider" />
          <button type="button" role="menuitem" className="hb-header-menu__danger" onClick={() => run(onDelete)}>
            {t('menu.delete')}
          </button>
        </div>
      )}
    </div>
  );
}
