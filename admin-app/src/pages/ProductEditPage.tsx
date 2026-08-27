import { api, getConfig, type ProductPayload } from '../api/client';
import { ProductModal } from '../components/menu/ProductModal';

export function ProductEditPage() {
  const config = getConfig();
  const isNew = config.productAction === 'new';
  const returnUrl = config.returnUrl || `${config.adminUrl}edit.php?post_type=happybites_menu_item`;

  const handleSave = async (payload: ProductPayload & { id?: number }) => {
    if (payload.id) {
      await api.updateProduct(payload.id, payload);
    } else {
      await api.createProduct(payload);
    }
    window.location.href = returnUrl;
  };

  const handleClose = () => {
    window.location.href = returnUrl;
  };

  return (
    <div className="hb-admin hb-product-edit-page">
      <ProductModal
        embedded
        mode={isNew ? 'add' : 'edit'}
        initialData={
          isNew
            ? { category_id: config.categoryId || 0 }
            : { id: config.productId }
        }
        onClose={handleClose}
        onSave={handleSave}
      />
    </div>
  );
}
