import { useEffect, useState } from 'react';
import type { Category } from '../../api/client';
import { FormField } from '../ui/FormField';

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
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSubcategory = Boolean(initialData.parent_id && initialData.parent_id > 0);

  useEffect(() => {
    setName(initialData.name || '');
    setDescription(initialData.description || '');
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
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kaydetme başarısız');
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
              {mode === 'add' ? (isSubcategory ? 'Alt Kategori Ekle' : 'Kategori Ekle') : 'Kategori Düzenle'}
            </h2>
            <p className="hb-modal__subtitle">
              {isSubcategory ? 'Ana kategorinin altında listelenir.' : 'Menüde üst seviye bölüm olarak görünür.'}
            </p>
          </div>
          <button type="button" className="hb-modal__close" onClick={onClose} aria-label="Kapat">
            ×
          </button>
        </div>

        {error && (
          <div className="hb-modal__alert">
            <div className="hb-alert hb-alert--error">{error}</div>
          </div>
        )}

        <div className="hb-modal__body">
          <FormField label="Kategori Adı" hint={nameError ? 'Kategori adı zorunludur.' : undefined}>
            <input
              className={`hb-input${nameError ? ' is-invalid' : ''}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isSubcategory ? 'Örn. Sıcak İçecekler' : 'Örn. Ana Yemekler'}
              autoFocus
            />
          </FormField>

          <FormField label="Açıklama" hint="İsteğe bağlı. Menüde kategori başlığının altında gösterilebilir.">
            <textarea
              className="hb-input hb-input--compact"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Kısa bir tanıtım metni..."
              maxLength={300}
            />
            <div className="hb-textarea-meta">
              <span>{description.length}/300</span>
            </div>
          </FormField>
        </div>

        <div className="hb-modal__foot">
          <button type="button" className="button" onClick={onClose} disabled={saving}>
            İptal
          </button>
          <button type="button" className="button button-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Kaydediliyor...' : mode === 'add' ? 'Kategoriyi Ekle' : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  );
}
