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
  type SaveOrderPayload,
} from '../api/client';
import { CategoryModal } from '../components/menu/CategoryModal';
import { ProductListItem } from '../components/menu/ProductListItem';
import { ProductModal } from '../components/menu/ProductModal';
import { Alert } from '../components/ui/Alert';
import { PageHeader } from '../components/ui/PageHeader';
import { getConfig } from '../api/client';
import { normalizeStringArray } from '../utils/normalize';

type CategoryModalState =
  | { open: false }
  | { open: true; mode: 'add' | 'edit'; category: Partial<Category> };

type ProductModalState =
  | { open: false }
  | { open: true; mode: 'add' | 'edit'; product: Partial<Product> };

export function MenuPage() {
  const [data, setData] = useState<MenuTreeResponse>({ categories: [], uncategorizedProducts: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [categoryModal, setCategoryModal] = useState<CategoryModalState>({ open: false });
  const [productModal, setProductModal] = useState<ProductModalState>({ open: false });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.getMenuTree();
      setData(normalizeMenuTree(response.data));
      setHasChanges(false);
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Menü yüklenemedi' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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
      setMessage({ type: 'success', text: 'Değişiklikler kaydedildi.' });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Kaydetme başarısız' });
    } finally {
      setSaving(false);
    }
  };

  const onDragEnd = (result: DropResult) => {
    const { source, destination, type } = result;
    if (!destination) return;

    const next = structuredClone(data);

    if (type === 'CATEGORY') {
      const [moved] = next.categories.splice(source.index, 1);
      next.categories.splice(destination.index, 0, moved);
    } else if (type === 'PRODUCT') {
      const sourceList = getDroppableList(next, source.droppableId);
      const destList = getDroppableList(next, destination.droppableId);
      if (!sourceList || !destList) return;

      const [moved] = sourceList.list.splice(source.index, 1);
      const destCategoryId = destList.categoryId;
      moved.category_id = destCategoryId;
      destList.list.splice(destination.index, 0, moved);
    }

    setData(next);
    setHasChanges(true);
  };

  const handleDeleteCategory = async (category: Category) => {
    if (!window.confirm('Bu kategori silinsin mi? Ürünler kategorisiz alana taşınır.')) return;
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
      setMessage({ type: 'success', text: 'Kategori silindi.' });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Silme başarısız' });
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!window.confirm('Bu ürün silinsin mi?')) return;
    try {
      await api.deleteProduct(product.id);
      const next = structuredClone(data);
      removeProductEverywhere(next, product.id);
      setData(next);
      setHasChanges(true);
      setMessage({ type: 'success', text: 'Ürün silindi.' });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Silme başarısız' });
    }
  };

  const handleSaveCategory = async (category: Partial<Category>) => {
    try {
      const payload = {
        name: category.name || '',
        description: category.description || '',
        parent_id: category.parent_id || 0,
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
      setMessage({ type: 'success', text: 'Kategori kaydedildi.' });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Kaydetme başarısız' });
      throw error;
    }
  };

  const handleSaveProduct = async (payload: ProductPayload & { id?: number }) => {
    try {
      const response =
        payload.id && productModal.open && productModal.mode === 'edit'
          ? await api.updateProduct(payload.id, payload)
          : await api.createProduct(payload);

      const saved = response.data;
      const next = structuredClone(data);
      removeProductEverywhere(next, saved.id);

      const item: Product = {
        id: saved.id!,
        title: saved.title,
        price: saved.price,
        description: saved.description || '',
        tags: normalizeStringArray(saved.tags),
        image: saved.image || '',
        image_id: saved.image_id || 0,
        category_id: saved.category_id,
      };

      if ((saved.category_id || 0) > 0) {
        const target = findCategory(next.categories, saved.category_id!);
        target?.products.push(item);
      } else {
        next.uncategorizedProducts.push(item);
      }

      setData(next);
      setHasChanges(true);
      setProductModal({ open: false });
      setMessage({ type: 'success', text: 'Ürün kaydedildi.' });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Kaydetme başarısız' });
      throw error;
    }
  };

  const currency = getConfig().settings.default_currency;

  const productCount =
    data.categories.reduce(
      (sum, cat) =>
        sum + cat.products.length + cat.subcategories.reduce((s, sub) => s + sub.products.length, 0),
      0,
    ) + data.uncategorizedProducts.length;

  return (
    <div className="hb-admin">
      <PageHeader
        title="Menü Yönetimi"
        description="Kategorileri ve ürünleri sürükleyerek sıralayın."
        actions={
          <>
            <button type="button" className="button" onClick={load} disabled={loading}>
              Yenile
            </button>
            <button
              type="button"
              className="button button-primary"
              onClick={saveAll}
              disabled={saving || !hasChanges}
            >
              {saving ? 'Kaydediliyor...' : hasChanges ? 'Değişiklikleri Kaydet' : 'Kaydedildi'}
            </button>
          </>
        }
      />

      {message && (
        <Alert type={message.type} onDismiss={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      {!loading && (
        <div className="hb-toolbar">
          <div className="hb-toolbar__left">
            <span className="hb-badge">{data.categories.length} kategori</span>
            <span className="hb-badge hb-badge--muted">{productCount} ürün</span>
            {hasChanges && <span className="hb-badge hb-badge--warn">Kaydedilmemiş değişiklik</span>}
          </div>
        </div>
      )}

      {loading ? (
        <div className="hb-loading">
          <span className="hb-spinner" />
          Menü yükleniyor...
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="hb-layout-2">
            <div>
              <Droppable droppableId="categories" type="CATEGORY">
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps}>
                    {data.categories.map((category, index) => (
                      <Draggable key={category.id} draggableId={`cat-${category.id}`} index={index}>
                        {(dragProvided) => (
                          <div
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            className="hb-category-block"
                          >
                            <div className="hb-category-header" {...dragProvided.dragHandleProps}>
                              <span className="hb-drag-handle" title="Sürükle">⠿</span>
                              <span className="hb-category-header__title">{category.name}</span>
                              <div className="hb-category-header__actions">
                                <button
                                  type="button"
                                  className="button button-small"
                                  title="Düzenle"
                                  onClick={() => setCategoryModal({ open: true, mode: 'edit', category })}
                                >
                                  ✎
                                </button>
                                <button
                                  type="button"
                                  className="button button-small"
                                  title="Alt kategori ekle"
                                  onClick={() =>
                                    setCategoryModal({
                                      open: true,
                                      mode: 'add',
                                      category: { parent_id: category.id, name: '', description: '' },
                                    })
                                  }
                                >
                                  + Alt
                                </button>
                                <button
                                  type="button"
                                  className="button button-small"
                                  title="Ürün ekle"
                                  onClick={() =>
                                    setProductModal({
                                      open: true,
                                      mode: 'add',
                                      product: { category_id: category.id, title: '', price: 0, tags: [], description: '' },
                                    })
                                  }
                                >
                                  + Ürün
                                </button>
                                <button
                                  type="button"
                                  className="button button-small hb-btn-danger"
                                  title="Sil"
                                  onClick={() => handleDeleteCategory(category)}
                                >
                                  ✕
                                </button>
                              </div>
                            </div>

                            <div className="hb-category-body">
                              <Droppable droppableId={`products-${category.id}`} type="PRODUCT">
                                {(dropProvided) => (
                                  <div ref={dropProvided.innerRef} {...dropProvided.droppableProps}>
                                    {category.products.map((product, productIndex) => (
                                      <Draggable key={product.id} draggableId={`prod-${product.id}`} index={productIndex}>
                                        {(productDrag) => (
                                          <div
                                            ref={productDrag.innerRef}
                                            {...productDrag.draggableProps}
                                            className="hb-product-row"
                                          >
                                            <ProductListItem
                                              product={product}
                                              currency={currency}
                                              dragHandleProps={productDrag.dragHandleProps}
                                              onEdit={() => setProductModal({ open: true, mode: 'edit', product })}
                                              onDelete={() => handleDeleteProduct(product)}
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
                                <div key={sub.id} className="hb-subcategory">
                                  <div className="hb-category-header hb-category-header--sub">
                                    <span className="hb-category-header__title">{sub.name}</span>
                                    <div className="hb-category-header__actions">
                                      <button
                                        type="button"
                                        className="button button-small"
                                        title="Düzenle"
                                        onClick={() => setCategoryModal({ open: true, mode: 'edit', category: sub })}
                                      >
                                        ✎
                                      </button>
                                      <button
                                        type="button"
                                        className="button button-small"
                                        title="Ürün ekle"
                                        onClick={() =>
                                          setProductModal({
                                            open: true,
                                            mode: 'add',
                                            product: { category_id: sub.id, title: '', price: 0, tags: [], description: '' },
                                          })
                                        }
                                      >
                                        + Ürün
                                      </button>
                                      <button
                                        type="button"
                                        className="button button-small hb-btn-danger"
                                        title="Sil"
                                        onClick={() => handleDeleteCategory(sub)}
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  </div>
                                  <Droppable droppableId={`products-${sub.id}`} type="PRODUCT">
                                    {(dropProvided) => (
                                      <div ref={dropProvided.innerRef} {...dropProvided.droppableProps} className="hb-category-body">
                                        {sub.products.map((product, productIndex) => (
                                          <Draggable key={product.id} draggableId={`prod-${product.id}`} index={productIndex}>
                                            {(productDrag) => (
                                              <div
                                                ref={productDrag.innerRef}
                                                {...productDrag.draggableProps}
                                                className="hb-product-row"
                                              >
                                                <ProductListItem
                                                  product={product}
                                                  currency={currency}
                                                  dragHandleProps={productDrag.dragHandleProps}
                                                  onEdit={() => setProductModal({ open: true, mode: 'edit', product })}
                                                  onDelete={() => handleDeleteProduct(product)}
                                                />
                                              </div>
                                            )}
                                          </Draggable>
                                        ))}
                                        {dropProvided.placeholder}
                                      </div>
                                    )}
                                  </Droppable>
                                </div>
                              ))}
                            </div>
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
                + Ana Kategori Ekle
              </button>
            </div>

            <div className="hb-side-panel">
              <div className="hb-side-panel__head">
                <h3>Kategorisiz Ürünler</h3>
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
                  + Ürün
                </button>
              </div>

              <div className="hb-side-panel__body">
                <Droppable droppableId="uncategorized" type="PRODUCT">
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps}>
                      {data.uncategorizedProducts.length === 0 && (
                        <p className="hb-empty">Kategorisiz ürün yok. Ürünleri buraya sürükleyebilirsiniz.</p>
                      )}
                      {data.uncategorizedProducts.map((product, index) => (
                        <Draggable key={product.id} draggableId={`uncat-${product.id}`} index={index}>
                          {(dragProvided) => (
                            <div
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              className="hb-product-row"
                            >
                              <ProductListItem
                                product={product}
                                currency={currency}
                                dragHandleProps={dragProvided.dragHandleProps}
                                onEdit={() => setProductModal({ open: true, mode: 'edit', product })}
                                onDelete={() => handleDeleteProduct(product)}
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
