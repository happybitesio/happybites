import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from '@hello-pangea/dnd';
import {
  api,
  type Category,
  type MenuTreeResponse,
  type Product,
  type ProductPayload,
  type ProductStatus,
  type SaveOrderPayload,
} from '../api/client';
import { BulkBar } from '../components/menu/BulkBar';
import { CategoryBlock, type ProductRowHandlers } from '../components/menu/CategoryBlock';
import { CategoryModal } from '../components/menu/CategoryModal';
import { MoveProductMenu, type MovePosition } from '../components/menu/MoveProductMenu';
import { ProductListItem } from '../components/menu/ProductListItem';
import { ProductModal } from '../components/menu/ProductModal';
import { Alert } from '../components/ui/Alert';
import { PageHeader } from '../components/ui/PageHeader';
import { getConfig } from '../api/client';
import { t } from '../i18n';
import { normalizeStringArray } from '../utils/normalize';

type CategoryModalState =
  | { open: false }
  | { open: true; mode: 'add' | 'edit'; category: Partial<Category> };

type ProductModalState =
  | { open: false }
  | { open: true; mode: 'add' | 'edit'; product: Partial<Product> };

type MoveMenuState =
  | { open: false }
  | { open: true; productIds: number[]; currentCategoryId?: number; single: boolean };

const EXPANDED_STORAGE_KEY = 'hb-menu-expanded';

function loadExpanded(): Set<number> {
  try {
    const raw = window.localStorage.getItem(EXPANDED_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed.filter((v) => typeof v === 'number') : []);
  } catch {
    return new Set();
  }
}

export function MenuPage() {
  const [data, setData] = useState<MenuTreeResponse>({ categories: [], uncategorizedProducts: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [categoryModal, setCategoryModal] = useState<CategoryModalState>({ open: false });
  const [productModal, setProductModal] = useState<ProductModalState>({ open: false });
  const [moveMenu, setMoveMenu] = useState<MoveMenuState>({ open: false });
  const [expandedIds, setExpandedIds] = useState<Set<number>>(loadExpanded);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  const query = search.trim().toLowerCase();
  const filtering = query.length > 0;

  const matchesProduct = useCallback(
    (product: Product) => {
      if (query === '') return true;
      return (
        product.title.toLowerCase().includes(query) ||
        product.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    },
    [query],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.getMenuTree();
      setData(normalizeMenuTree(response.data));
      setHasChanges(false);
      setSelectedIds(new Set());
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : t('menu.loadFailed') });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    try {
      window.localStorage.setItem(EXPANDED_STORAGE_KEY, JSON.stringify([...expandedIds]));
    } catch {
      // Storage may be unavailable (private mode); expansion state is optional.
    }
  }, [expandedIds]);

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (hasChanges) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasChanges]);

  const buildSavePayload = useMemo((): SaveOrderPayload => ({
    categories: data.categories.map((category, catIndex) => ({
      id: category.id,
      order: catIndex,
      subcategories: category.subcategories.map((sub, subIndex) => ({
        id: sub.id,
        order: subIndex,
        products: sub.products.map((product, prodIndex) => ({
          id: product.id,
          order: prodIndex,
          category_id: sub.id,
        })),
      })),
      products: category.products.map((product, prodIndex) => ({
        id: product.id,
        order: prodIndex,
        category_id: category.id,
      })),
    })),
    uncategorizedProducts: data.uncategorizedProducts.map((product, index) => ({
      id: product.id,
      order: index,
    })),
  }), [data]);

  const saveAll = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await api.saveMenuOrder(buildSavePayload);
      setHasChanges(false);
      setMessage({ type: 'success', text: t('menu.saveSuccess') });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : t('menu.saveFailed') });
    } finally {
      setSaving(false);
    }
  };

  // ── Expand / collapse ──

  const toggleExpand = useCallback((id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const expandCategory = (next: Set<number>, id: number) => {
    next.add(id);
  };

  const expandAll = () => {
    const all = new Set<number>();
    const walk = (categories: Category[]) => {
      for (const category of categories) {
        all.add(category.id);
        walk(category.subcategories);
      }
    };
    walk(data.categories);
    setExpandedIds(all);
  };

  const collapseAll = () => setExpandedIds(new Set());

  // ── Drag & drop ──

  const onDragEnd = (result: DropResult) => {
    const { source, destination, type } = result;
    if (!destination) return;

    const next = structuredClone(data);

    if (type === 'CATEGORY') {
      const [moved] = next.categories.splice(source.index, 1);
      next.categories.splice(destination.index, 0, moved);
    } else if (type === 'PRODUCT') {
      const sourceList = getDroppableList(next, source.droppableId);
      if (!sourceList) return;

      if (destination.droppableId.startsWith('cathead-')) {
        // Dropped on a (possibly collapsed) category header: append to the end.
        const categoryId = Number(destination.droppableId.replace('cathead-', ''));
        const target = findCategory(next.categories, categoryId);
        if (!target) return;

        const [moved] = sourceList.list.splice(source.index, 1);
        moved.category_id = categoryId;
        target.products.push(moved);
        setExpandedIds((prev) => {
          const opened = new Set(prev);
          expandCategory(opened, categoryId);
          return opened;
        });
      } else {
        const destList = getDroppableList(next, destination.droppableId);
        if (!destList) return;

        const [moved] = sourceList.list.splice(source.index, 1);
        moved.category_id = destList.categoryId;
        destList.list.splice(destination.index, 0, moved);
      }
    }

    setData(next);
    setHasChanges(true);
  };

  // ── Move via menu ──

  const moveProducts = (productIds: number[], targetCategoryId: number, position: MovePosition) => {
    const idSet = new Set(productIds);
    const next = structuredClone(data);
    const collected: Product[] = [];

    const pull = (list: Product[]): Product[] => {
      const kept: Product[] = [];
      for (const product of list) {
        if (idSet.has(product.id)) {
          collected.push(product);
        } else {
          kept.push(product);
        }
      }
      return kept;
    };

    const walk = (categories: Category[]) => {
      for (const category of categories) {
        category.products = pull(category.products);
        walk(category.subcategories);
      }
    };
    walk(next.categories);
    next.uncategorizedProducts = pull(next.uncategorizedProducts);

    if (collected.length === 0) return;

    for (const product of collected) {
      product.category_id = targetCategoryId;
    }

    const targetList =
      targetCategoryId === 0 ? next.uncategorizedProducts : findCategory(next.categories, targetCategoryId)?.products;
    if (!targetList) return;

    if (position === 'start') {
      targetList.unshift(...collected);
    } else {
      targetList.push(...collected);
    }

    setData(next);
    setHasChanges(true);
    setMoveMenu({ open: false });
    setSelectedIds(new Set());
    if (targetCategoryId > 0) {
      setExpandedIds((prev) => {
        const opened = new Set(prev);
        expandCategory(opened, targetCategoryId);
        return opened;
      });
    }
    setMessage({ type: 'success', text: t('menu.moveDone', { count: collected.length }) });
  };

  const moveWithinCategory = (productId: number, edge: 'top' | 'bottom') => {
    const next = structuredClone(data);
    const placement = findProductPlacement(next, productId);
    if (!placement) return;

    const list =
      placement.categoryId === 0
        ? next.uncategorizedProducts
        : findCategory(next.categories, placement.categoryId)?.products;
    if (!list) return;

    const [moved] = list.splice(placement.index, 1);
    if (edge === 'top') {
      list.unshift(moved);
    } else {
      list.push(moved);
    }

    setData(next);
    setHasChanges(true);
    setMoveMenu({ open: false });
    setMessage({ type: 'success', text: t('menu.moveDone', { count: 1 }) });
  };

  // ── Selection & bulk actions ──

  const toggleSelect = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectCategory = (category: Category, select: boolean) => {
    const ids: number[] = [];
    const walk = (cat: Category) => {
      for (const product of cat.products) ids.push(product.id);
      for (const sub of cat.subcategories) walk(sub);
    };
    walk(category);

    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const id of ids) {
        if (select) {
          next.add(id);
        } else {
          next.delete(id);
        }
      }
      return next;
    });
  };

  const bulkDelete = async () => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    if (!window.confirm(t('menu.bulkDeleteConfirm', { count: ids.length }))) return;

    setBulkBusy(true);
    setMessage(null);
    const results = await Promise.allSettled(ids.map((id) => api.deleteProduct(id)));
    const deleted = ids.filter((_, index) => results[index].status === 'fulfilled');
    const failed = ids.length - deleted.length;

    const next = structuredClone(data);
    for (const id of deleted) {
      removeProductEverywhere(next, id);
    }
    setData(next);
    setSelectedIds(new Set());
    setBulkBusy(false);
    setHasChanges(true);
    setMessage(
      failed > 0
        ? { type: 'error', text: t('menu.bulkPartialFail', { count: failed }) }
        : { type: 'success', text: t('menu.bulkDeleted', { count: deleted.length }) },
    );
  };

  const bulkStatus = async (status: ProductStatus) => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;

    setBulkBusy(true);
    setMessage(null);
    const results = await Promise.allSettled(ids.map((id) => api.setProductStatus(id, status)));
    const updated = ids.filter((_, index) => results[index].status === 'fulfilled');
    const failed = ids.length - updated.length;

    const updatedSet = new Set(updated);
    const next = structuredClone(data);
    forEachProduct(next, (product) => {
      if (updatedSet.has(product.id)) {
        product.status = status;
      }
    });
    setData(next);
    setBulkBusy(false);
    setMessage(
      failed > 0
        ? { type: 'error', text: t('menu.bulkPartialFail', { count: failed }) }
        : { type: 'success', text: t('menu.bulkStatusUpdated', { count: updated.length }) },
    );
  };

  const toggleProductStatus = async (product: Product) => {
    const nextStatus: ProductStatus = product.status === 'draft' ? 'publish' : 'draft';
    try {
      await api.setProductStatus(product.id, nextStatus);
      const next = structuredClone(data);
      forEachProduct(next, (item) => {
        if (item.id === product.id) {
          item.status = nextStatus;
        }
      });
      setData(next);
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : t('menu.saveFailed') });
    }
  };

  // ── Sorting helpers ──

  const sortCategoryProducts = (categoryId: number, by: 'name' | 'price') => {
    const next = structuredClone(data);
    const list = categoryId === 0 ? next.uncategorizedProducts : findCategory(next.categories, categoryId)?.products;
    if (!list || list.length < 2) return;

    list.sort((a, b) => (by === 'name' ? a.title.localeCompare(b.title) : a.price - b.price));
    setData(next);
    setHasChanges(true);
  };

  // ── CRUD (unchanged behavior) ──

  const handleDeleteCategory = async (category: Category) => {
    if (!window.confirm(t('menu.deleteCategoryConfirm'))) return;
    try {
      await api.deleteCategory(category.id);
      const next = structuredClone(data);
      const removed = removeCategory(next.categories, category.id);
      if (removed) {
        const products = collectProducts(removed);
        next.uncategorizedProducts.push(...products.map((p) => ({ ...p, category_id: 0 })));
      }
      setData(next);
      setHasChanges(true);
      setMessage({ type: 'success', text: t('menu.categoryDeleted') });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : t('menu.deleteFailed') });
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!window.confirm(t('menu.deleteProductConfirm'))) return;
    try {
      await api.deleteProduct(product.id);
      const next = structuredClone(data);
      removeProductEverywhere(next, product.id);
      setData(next);
      setHasChanges(true);
      setMessage({ type: 'success', text: t('menu.productDeleted') });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : t('menu.deleteFailed') });
    }
  };

  const handleSaveCategory = async (category: Partial<Category>) => {
    try {
      const payload = {
        name: category.name || '',
        description: category.description || '',
        parent_id: category.parent_id || 0,
        image_id: category.image_id ?? null,
      };

      const response =
        category.id && categoryModal.open && categoryModal.mode === 'edit'
          ? await api.updateCategory(category.id, payload)
          : await api.createCategory(payload);

      const saved = response.data;
      const next = structuredClone(data);

      if (categoryModal.open && categoryModal.mode === 'edit' && category.id) {
        const node = findCategory(next.categories, category.id);
        if (node) {
          node.name = saved.name;
          node.description = saved.description || '';
          node.image = saved.image || '';
          node.image_id = saved.image_id ?? null;
        }
      } else {
        const targetList = saved.parent_id
          ? findCategory(next.categories, saved.parent_id)?.subcategories
          : next.categories;
        targetList?.push({
          ...saved,
          products: [],
          subcategories: [],
        });
        setHasChanges(true);
      }

      setData(next);
      setCategoryModal({ open: false });
      setMessage({ type: 'success', text: t('menu.categorySaved') });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : t('menu.saveFailed') });
      throw error;
    }
  };

  const handleSaveProduct = async (payload: ProductPayload & { id?: number }) => {
    try {
      const isEdit = Boolean(payload.id && productModal.open && productModal.mode === 'edit');
      const placement = isEdit && payload.id ? findProductPlacement(data, payload.id) : null;

      const response =
        isEdit && payload.id
          ? await api.updateProduct(payload.id, payload)
          : await api.createProduct(payload);

      const saved = response.data;
      const savedId = saved.id;
      if (!savedId) {
        throw new Error(t('menu.saveFailed'));
      }

      const next = structuredClone(data);
      removeProductEverywhere(next, savedId);

      const item: Product = {
        id: savedId,
        title: saved.title,
        price: saved.price,
        description: saved.description || '',
        tags: normalizeStringArray(saved.tags),
        image: saved.image || '',
        image_id: saved.image_id || 0,
        category_id: saved.category_id,
        order: placement?.product.order ?? saved.order,
        status: saved.status === 'draft' ? 'draft' : 'publish',
      };

      const targetCategoryId = saved.category_id || 0;
      const sameCategory = placement?.categoryId === targetCategoryId;

      if (targetCategoryId > 0) {
        const target = findCategory(next.categories, targetCategoryId);
        if (target) {
          if (sameCategory && placement) {
            target.products.splice(placement.index, 0, item);
          } else {
            target.products.push(item);
          }
        }
        setExpandedIds((prev) => {
          const opened = new Set(prev);
          expandCategory(opened, targetCategoryId);
          return opened;
        });
      } else if (sameCategory && placement) {
        next.uncategorizedProducts.splice(placement.index, 0, item);
      } else {
        next.uncategorizedProducts.push(item);
      }

      setData(next);
      setHasChanges(!isEdit || !sameCategory);
      setProductModal({ open: false });
      setMessage({ type: 'success', text: t('menu.productSaved') });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : t('menu.saveFailed') });
      throw error;
    }
  };

  // ── Derived view data ──

  const currency = getConfig().settings.default_currency;

  const matchCount = filtering
    ? countMatches(data.categories, matchesProduct) + data.uncategorizedProducts.filter(matchesProduct).length
    : 0;

  const visibleUncategorized = filtering
    ? data.uncategorizedProducts.filter(matchesProduct)
    : data.uncategorizedProducts;

  const rowHandlers: ProductRowHandlers = {
    currency,
    selectedIds,
    onToggleSelect: toggleSelect,
    onEdit: (product) => setProductModal({ open: true, mode: 'edit', product }),
    onDelete: handleDeleteProduct,
    onMove: (product) =>
      setMoveMenu({
        open: true,
        productIds: [product.id],
        currentCategoryId: product.category_id ?? 0,
        single: true,
      }),
    onToggleStatus: toggleProductStatus,
  };

  return (
    <div className="hb-admin">
      <PageHeader title={t('menu.title')} description={t('menu.description')} />

      {message && (
        <Alert type={message.type} onDismiss={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      {!loading && (
        <div className="hb-toolbar hb-toolbar--sticky">
          <div className="hb-toolbar__left">
            <input
              type="search"
              className="hb-toolbar__search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('menu.searchPlaceholder')}
            />
            {filtering && (
              <span className="hb-count hb-count--accent">{t('menu.searchResults', { count: matchCount })}</span>
            )}
            {hasChanges && <span className="hb-count hb-count--warn">{t('menu.unsaved')}</span>}
          </div>
          <div className="hb-toolbar__right">
            <button type="button" className="button" onClick={expandAll} disabled={filtering}>
              {t('menu.expandAll')}
            </button>
            <button type="button" className="button" onClick={collapseAll} disabled={filtering}>
              {t('menu.collapseAll')}
            </button>
            <button type="button" className="button" onClick={load} disabled={loading}>
              {t('menu.refresh')}
            </button>
            <button
              type="button"
              className="button button-primary"
              onClick={saveAll}
              disabled={saving || !hasChanges}
            >
              {saving ? t('menu.saving') : hasChanges ? t('menu.saveChanges') : t('menu.saved')}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="hb-loading">
          <span className="hb-spinner" />
          {t('menu.loading')}
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="hb-layout-2">
            <div>
              <Droppable droppableId="categories" type="CATEGORY">
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps}>
                    {data.categories.map((category, index) => (
                      <Draggable
                        key={category.id}
                        draggableId={`cat-${category.id}`}
                        index={index}
                        isDragDisabled={filtering}
                      >
                        {(dragProvided) => (
                          <div ref={dragProvided.innerRef} {...dragProvided.draggableProps}>
                            <CategoryBlock
                              category={category}
                              dragHandleProps={dragProvided.dragHandleProps}
                              expandedIds={expandedIds}
                              onToggleExpand={toggleExpand}
                              filtering={filtering}
                              matchesProduct={matchesProduct}
                              row={rowHandlers}
                              onEditCategory={(cat) => setCategoryModal({ open: true, mode: 'edit', category: cat })}
                              onDeleteCategory={handleDeleteCategory}
                              onAddSubcategory={(cat) =>
                                setCategoryModal({
                                  open: true,
                                  mode: 'add',
                                  category: { parent_id: cat.id, name: '', description: '' },
                                })
                              }
                              onAddProduct={(categoryId) =>
                                setProductModal({
                                  open: true,
                                  mode: 'add',
                                  product: { category_id: categoryId, title: '', price: 0, tags: [], description: '' },
                                })
                              }
                              onSortProducts={sortCategoryProducts}
                              onSelectCategory={selectCategory}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>

              <button
                type="button"
                className="hb-add-block"
                onClick={() => setCategoryModal({ open: true, mode: 'add', category: { parent_id: 0, name: '', description: '' } })}
              >
                {t('menu.addMainCategory')}
              </button>
            </div>

            <div className="hb-side-panel">
              <div className="hb-side-panel__head">
                <h3>{t('menu.uncategorizedTitle')}</h3>
                <span className="hb-badge hb-badge--muted">{data.uncategorizedProducts.length}</span>
                <button
                  type="button"
                  className="button button-small"
                  onClick={() =>
                    setProductModal({
                      open: true,
                      mode: 'add',
                      product: { category_id: 0, title: '', price: 0, tags: [], description: '' },
                    })
                  }
                >
                  {t('menu.addProductBtn')}
                </button>
              </div>

              <div className="hb-side-panel__body">
                <Droppable droppableId="uncategorized" type="PRODUCT" isDropDisabled={filtering}>
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps}>
                      {visibleUncategorized.length === 0 && (
                        <p className="hb-empty">{t('menu.uncategorizedEmpty')}</p>
                      )}
                      {visibleUncategorized.map((product, index) => (
                        <Draggable
                          key={product.id}
                          draggableId={`uncat-${product.id}`}
                          index={index}
                          isDragDisabled={filtering}
                        >
                          {(dragProvided) => (
                            <div
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              className={`hb-product-row${selectedIds.has(product.id) ? ' is-selected' : ''}${product.status === 'draft' ? ' is-draft' : ''}`}
                            >
                              <ProductListItem
                                product={product}
                                currency={currency}
                                dragHandleProps={dragProvided.dragHandleProps}
                                dragDisabled={filtering}
                                selected={selectedIds.has(product.id)}
                                onToggleSelect={() => toggleSelect(product.id)}
                                onEdit={() => setProductModal({ open: true, mode: 'edit', product })}
                                onDelete={() => handleDeleteProduct(product)}
                                onMove={() =>
                                  setMoveMenu({
                                    open: true,
                                    productIds: [product.id],
                                    currentCategoryId: 0,
                                    single: true,
                                  })
                                }
                                onToggleStatus={() => toggleProductStatus(product)}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            </div>
          </div>
        </DragDropContext>
      )}

      {selectedIds.size > 0 && (
        <BulkBar
          count={selectedIds.size}
          busy={bulkBusy}
          onMove={() => setMoveMenu({ open: true, productIds: [...selectedIds], single: false })}
          onPublish={() => bulkStatus('publish')}
          onDraft={() => bulkStatus('draft')}
          onDelete={bulkDelete}
          onClear={() => setSelectedIds(new Set())}
        />
      )}

      {moveMenu.open && (
        <MoveProductMenu
          categories={data.categories}
          count={moveMenu.productIds.length}
          currentCategoryId={moveMenu.currentCategoryId}
          onMove={(targetCategoryId, position) => moveProducts(moveMenu.productIds, targetCategoryId, position)}
          onMoveWithin={
            moveMenu.single ? (edge) => moveWithinCategory(moveMenu.productIds[0], edge) : undefined
          }
          onClose={() => setMoveMenu({ open: false })}
        />
      )}

      {categoryModal.open && (
        <CategoryModal
          mode={categoryModal.mode}
          initialData={categoryModal.category}
          onClose={() => setCategoryModal({ open: false })}
          onSave={handleSaveCategory}
        />
      )}

      {productModal.open && (
        <ProductModal
          mode={productModal.mode}
          initialData={productModal.product}
          categoryName={resolveCategoryName(data.categories, productModal.product.category_id)}
          onClose={() => setProductModal({ open: false })}
          onSave={handleSaveProduct}
        />
      )}
    </div>
  );
}

function normalizeMenuTree(data: MenuTreeResponse): MenuTreeResponse {
  return {
    categories: (data.categories || []).map(normalizeCategory),
    uncategorizedProducts: (data.uncategorizedProducts || []).map(normalizeProduct),
  };
}

function normalizeCategory(category: Category): Category {
  return {
    ...category,
    products: (category.products || []).map(normalizeProduct),
    subcategories: (category.subcategories || []).map(normalizeCategory),
  };
}

function normalizeProduct(product: Product): Product {
  return {
    ...product,
    tags: normalizeStringArray(product.tags),
    status: product.status === 'draft' ? 'draft' : 'publish',
  };
}

function resolveCategoryName(categories: Category[], categoryId?: number): string | undefined {
  if (!categoryId || categoryId <= 0) return undefined;

  const walk = (items: Category[]): string | undefined => {
    for (const category of items) {
      if (category.id === categoryId) return category.name;
      const nested = walk(category.subcategories);
      if (nested) return nested;
    }
    return undefined;
  };

  return walk(categories);
}

function findCategory(categories: Category[], id: number): Category | null {
  for (const category of categories) {
    if (category.id === id) return category;
    const found = findCategory(category.subcategories, id);
    if (found) return found;
  }
  return null;
}

function removeCategory(categories: Category[], id: number): Category | null {
  const index = categories.findIndex((cat) => cat.id === id);
  if (index >= 0) {
    const [removed] = categories.splice(index, 1);
    return removed;
  }
  for (const category of categories) {
    const removed = removeCategory(category.subcategories, id);
    if (removed) return removed;
  }
  return null;
}

function collectProducts(category: Category): Product[] {
  const products = [...(category.products || [])];
  for (const sub of category.subcategories || []) {
    products.push(...collectProducts(sub));
  }
  return products;
}

function countMatches(categories: Category[], matches: (product: Product) => boolean): number {
  let count = 0;
  for (const category of categories) {
    count += category.products.filter(matches).length;
    count += countMatches(category.subcategories, matches);
  }
  return count;
}

function forEachProduct(data: MenuTreeResponse, fn: (product: Product) => void) {
  const walk = (categories: Category[]) => {
    for (const category of categories) {
      category.products.forEach(fn);
      walk(category.subcategories);
    }
  };
  walk(data.categories);
  data.uncategorizedProducts.forEach(fn);
}

function getDroppableList(
  data: MenuTreeResponse,
  droppableId: string,
): { list: Product[]; categoryId: number } | null {
  if (droppableId === 'uncategorized') {
    return { list: data.uncategorizedProducts, categoryId: 0 };
  }

  if (!droppableId.startsWith('products-')) {
    return null;
  }

  const categoryId = Number(droppableId.replace('products-', ''));
  const list = findProductList(data, categoryId);
  return list ? { list, categoryId } : null;
}

function findProductList(data: MenuTreeResponse, categoryId: number): Product[] | null {
  const category = findCategory(data.categories, categoryId);
  return category ? category.products : null;
}

function findProductPlacement(
  data: MenuTreeResponse,
  productId: number,
): { categoryId: number; index: number; product: Product } | null {
  const uncategorizedIndex = data.uncategorizedProducts.findIndex((product) => product.id === productId);
  if (uncategorizedIndex >= 0) {
    return {
      categoryId: 0,
      index: uncategorizedIndex,
      product: data.uncategorizedProducts[uncategorizedIndex],
    };
  }

  const walk = (categories: Category[]): { categoryId: number; index: number; product: Product } | null => {
    for (const category of categories) {
      const index = category.products.findIndex((product) => product.id === productId);
      if (index >= 0) {
        return {
          categoryId: category.id,
          index,
          product: category.products[index],
        };
      }

      const nested = walk(category.subcategories);
      if (nested) return nested;
    }

    return null;
  };

  return walk(data.categories);
}

function removeProductEverywhere(data: MenuTreeResponse, productId: number) {
  const walk = (categories: Category[]) => {
    for (const category of categories) {
      category.products = category.products.filter((product) => product.id !== productId);
      walk(category.subcategories);
    }
  };
  walk(data.categories);
  data.uncategorizedProducts = data.uncategorizedProducts.filter((product) => product.id !== productId);
}
