import { useEffect, useState } from 'react';
import type { Category } from '../../api/client';
import { t } from '../../i18n';
import { FormField } from '../ui/FormField';
import { ImageField } from '../ui/ImageField';

interface Props {
  mode: 'add' | 'edit';
  initialData: Partial<Category>;
  onClose: () => void;
  onSave: (category: Partial<Category>) => Promise<void>;
}

function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [locked]);
}

export function CategoryModal({ mode, initialData, onClose, onSave }: Props) {
  useBodyScrollLock(true);
  const [name, setName] = useState(initialData.name || '');
  const [description, setDescription] = useState(initialData.description || '');
  const [imageUrl, setImageUrl] = useState(initialData.image || '');
  const [imageId, setImageId] = useState<number | null>(initialData.image_id ?? null);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSubcategory = Boolean(initialData.parent_id && initialData.parent_id > 0);

  useEffect(() => {
    setName(initialData.name || '');
    setDescription(initialData.description || '');
    setImageUrl(initialData.image || '');
    setImageId(initialData.image_id ?? null);
    setSubmitted(false);
  }, [initialData]);

  const nameError = submitted && name.trim() === '';

  const handleSave = async () => {
    setSubmitted(true);
    setError(null);
    if (name.trim() === '') return;

    setSaving(true);
    try {
      await onSave({
        ...initialData,
        name: name.trim(),
        description: description.trim(),
        image: imageUrl,
        image_id: imageId,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('menu.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="hb-modal-backdrop" onClick={onClose}>
      <div
        className="hb-modal hb-modal--compact"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="category-modal-title"
      >
        <div className="hb-modal__head">
          <div className="hb-modal__head-text">
            <h2 id="category-modal-title">
              {mode === 'add'
                ? isSubcategory
                  ? t('categoryModal.addSub')
                  : t('categoryModal.add')
                : t('categoryModal.edit')}
            </h2>
            <p className="hb-modal__subtitle">
              {isSubcategory ? t('categoryModal.subDesc') : t('categoryModal.mainDesc')}
            </p>
          </div>
          <button type="button" className="hb-modal__close" onClick={onClose} aria-label={t('common.close')}>
            ×
          </button>
        </div>

        {error && (
          <div className="hb-modal__alert">
            <div className="hb-alert hb-alert--error">{error}</div>
          </div>
        )}

        <div className="hb-modal__body">
          <FormField label={t('categoryModal.name')} hint={nameError ? t('categoryModal.nameRequired') : undefined}>
            <input
              className={`hb-input${nameError ? ' is-invalid' : ''}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isSubcategory ? t('categoryModal.namePlaceholderSub') : t('categoryModal.namePlaceholderMain')}
              autoFocus
            />
          </FormField>

          {!isSubcategory ? (
            <FormField label={t('categoryModal.image')} hint={t('categoryModal.imageHint')}>
              <ImageField
                value={imageUrl}
                onChange={(id, url) => {
                  setImageId(id);
                  setImageUrl(url);
                }}
                onClear={() => {
                  setImageId(null);
                  setImageUrl('');
                }}
              />
            </FormField>
          ) : null}

          <FormField label={t('categoryModal.description')} hint={t('categoryModal.descriptionHint')}>
            <textarea
              className="hb-input hb-input--compact"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder={t('categoryModal.descriptionPlaceholder')}
              maxLength={300}
            />
            <div className="hb-textarea-meta">
              <span>{description.length}/300</span>
            </div>
          </FormField>
        </div>

        <div className="hb-modal__foot">
          <button type="button" className="button" onClick={onClose} disabled={saving}>
            {t('common.cancel')}
          </button>
          <button type="button" className="button button-primary" onClick={handleSave} disabled={saving}>
            {saving ? t('common.saving') : mode === 'add' ? t('categoryModal.addBtn') : t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
