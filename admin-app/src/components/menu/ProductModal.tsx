import { useEffect, useMemo, useState } from 'react';
import { api, getConfig, type Product, type ProductDetails } from '../../api/client';
import { t, tlanguage } from '../../i18n';
import { CheckboxCard } from '../ui/CheckboxCard';
import { FormField } from '../ui/FormField';
import { ImageField } from '../ui/ImageField';
import { Tabs } from '../ui/Tabs';
import { LanguagesIcon } from '../ui/LanguagesIcon';
import {
  createEmptyProduct,
  emptyLocalizedFields,
  getActiveLanguages,
  getSpiceLevels,
  mergeProductDetails,
  toProductPayload,
} from '../../utils/productForm';
import type { ProductPayload } from '../../api/client';
import { normalizeStringArray } from '../../utils/normalize';

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

interface ProductTagOption {
  value: string;
  label: string;
  icon: string;
}

interface ProductTagGroup {
  title: string;
  tags: ProductTagOption[];
}

function getTagGroups(): ProductTagGroup[] {
  return [
    {
      title: t('productModal.tagGroups.status'),
      tags: [
        { value: 'out_of_stock', label: t('productModal.tagLabels.soldOut'), icon: '⛔' },
        { value: 'new_product', label: t('productModal.tagLabels.newItem'), icon: '✨' },
      ],
    },
    {
      title: t('productModal.tagGroups.diet'),
      tags: [
        { value: 'vegan', label: t('productModal.tagLabels.vegan'), icon: '🌱' },
        { value: 'vegetarian', label: t('productModal.tagLabels.vegetarian'), icon: '🥗' },
        { value: 'gluten_free', label: t('productModal.tagLabels.glutenFree'), icon: '🌾' },
        { value: 'organic', label: t('productModal.tagLabels.organic'), icon: '🍃' },
      ],
    },
    {
      title: t('productModal.tagGroups.featured'),
      tags: [
        { value: 'spicy', label: t('productModal.tagLabels.spicy'), icon: '🌶️' },
        { value: 'popular', label: t('productModal.tagLabels.popular'), icon: '🔥' },
        { value: 'seasonal', label: t('productModal.tagLabels.seasonal'), icon: '🍂' },
        { value: 'chef_special', label: t('productModal.tagLabels.chefChoice'), icon: '👨‍🍳' },
      ],
    },
  ];
}

type MainTabId = 'general' | 'content' | 'nutrition';

function ProductPreviewCard({
  title,
  description,
  price,
  currency,
  image,
  tags,
}: {
  title: string;
  description: string;
  price: number;
  currency: string;
  image: string;
  tags: Array<{ value: string; label: string; icon: string }>;
}) {
  return (
    <div className="hb-product-preview">
      <p className="hb-product-preview__label">{t('productModal.preview')}</p>
      <div className="hb-product-preview__card">
        {image ? (
          <div className="hb-product-preview__image" style={{ backgroundImage: `url(${image})` }} />
        ) : (
          <div className="hb-product-preview__image hb-product-preview__image--empty">
            <span>🍽️</span>
          </div>
        )}
        <div className="hb-product-preview__body">
          <h4 className="hb-product-preview__name">{title}</h4>
          {description ? (
            <p className="hb-product-preview__desc">{description}</p>
          ) : (
            <p className="hb-product-preview__desc hb-product-preview__desc--muted">{t('productModal.noDescription')}</p>
          )}
          {tags.length > 0 && (
            <div className="hb-product-preview__tags">
              {tags.map((tag) => (
                <span key={tag.value} className="hb-product-preview__tag">
                  {tag.icon} {tag.label}
                </span>
              ))}
            </div>
          )}
          <div className="hb-product-preview__price">
            {price.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} {currency}
          </div>
        </div>
      </div>
    </div>
  );
}

interface Props {
  mode: 'add' | 'edit';
  initialData: Partial<Product>;
  categoryName?: string;
  embedded?: boolean;
  onClose: () => void;
  onSave: (payload: ProductPayload & { id?: number }) => Promise<void>;
}

export function ProductModal({ mode, initialData, categoryName, embedded = false, onClose, onSave }: Props) {
  useBodyScrollLock(!embedded);

  const config = getConfig();
  const currency = config.settings.default_currency;
  const languages = getActiveLanguages();
  const defaultLang = config.settings.default_language || languages[0] || 'en';

  const mainTabs = [
    { id: 'general' as const, label: t('productModal.tabs.general'), icon: '📋' },
    { id: 'content' as const, label: t('productModal.tabs.content'), icon: <LanguagesIcon /> },
    { id: 'nutrition' as const, label: t('productModal.tabs.nutrition'), icon: '🥗' },
  ];

  const tagGroups = getTagGroups();
  const spiceLevels = getSpiceLevels();

  const [form, setForm] = useState<ProductDetails>(() =>
    createEmptyProduct(initialData.category_id || 0),
  );
  const [loading, setLoading] = useState(mode === 'edit' && Boolean(initialData.id));
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageTouched, setImageTouched] = useState(false);
  const [tab, setTab] = useState<MainTabId>('general');
  const [langTab, setLangTab] = useState(defaultLang);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      setSubmitted(false);
      setError(null);
      setImageTouched(false);
      setTab('general');
      setLangTab(defaultLang);

      if (mode === 'edit' && initialData.id) {
        setLoading(true);
        try {
          const response = await api.getProduct(initialData.id);
          if (!cancelled) {
            setForm(mergeProductDetails(initialData, response.data));
          }
        } catch (err) {
          if (!cancelled) {
            setError(err instanceof Error ? err.message : t('productModal.loadFailed'));
            setForm(createEmptyProduct(initialData.category_id || 0));
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
        return;
      }

      const empty = createEmptyProduct(initialData.category_id || 0);
      if (initialData.title) {
        empty.languages[defaultLang] = {
          ...empty.languages[defaultLang],
          title: initialData.title,
          description: initialData.description || '',
        };
      }
      setForm(empty);
      setLoading(false);
    };

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [mode, initialData.id, initialData.category_id, initialData.title, initialData.description, defaultLang]);

  const currentLang = form.languages[langTab];
  const defaultFields = form.languages[defaultLang];
  const titleError = submitted && !(defaultFields?.title || '').trim();

  const previewTitle = (defaultFields?.title || '').trim() || t('productModal.defaultTitle');
  const previewDescription = (defaultFields?.description || '').trim();
  const displayPrice = Number(form.price || 0);

  const previewTags = useMemo(
    () =>
      normalizeStringArray(form.tags)
        .map((value) => tagGroups.flatMap((g) => g.tags).find((tag) => tag.value === value))
        .filter((tag): tag is ProductTagOption => Boolean(tag)),
    [form.tags, tagGroups],
  );

  const updateForm = (patch: Partial<ProductDetails>) => {
    setForm((current) => ({ ...current, ...patch }));
  };

  const updateLang = (lang: string, patch: Partial<typeof currentLang>) => {
    setForm((current) => ({
      ...current,
      languages: {
        ...(current.languages || {}),
        [lang]: { ...(current.languages?.[lang] || emptyLocalizedFields()), ...patch },
      },
    }));
  };

  const handleSave = async () => {
    setSubmitted(true);
    setError(null);

    if (!(defaultFields?.title || '').trim()) {
      setTab('content');
      setLangTab(defaultLang);
      return;
    }

    setSaving(true);
    try {
      const payload = toProductPayload(form, { imageTouched });
      await onSave({ ...payload, id: form.id });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('productModal.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const locationLabel =
    categoryName ||
    (initialData.category_id && initialData.category_id > 0
      ? t('productModal.selectedCategory')
      : t('productModal.uncategorized'));

  const langTabs = languages.map((code) => ({
    id: code,
    label: tlanguage(code),
    icon: code.toUpperCase().slice(0, 2),
  }));

  return (
    <div
      className={embedded ? undefined : 'hb-modal-backdrop'}
      onClick={embedded ? undefined : onClose}
    >
      <div
        className={`hb-modal hb-modal--wide hb-modal--product${embedded ? ' hb-modal--embedded' : ''}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="product-modal-title"
      >
        <div className="hb-modal__head">
          <div className="hb-modal__head-text">
            <h2 id="product-modal-title">{mode === 'add' ? t('productModal.add') : t('productModal.edit')}</h2>
            <p className="hb-modal__subtitle">{locationLabel}</p>
          </div>
          <button
            type="button"
            className="hb-modal__close"
            onClick={onClose}
            aria-label={embedded ? t('common.back') : t('common.close')}
          >
            {embedded ? `← ${t('common.back')}` : '×'}
          </button>
        </div>

        {error && (
          <div className="hb-modal__alert">
            <div className="hb-alert hb-alert--error">{error}</div>
          </div>
        )}

        <div className="hb-modal__body hb-modal__body--form">
          {loading ? (
            <div className="hb-loading">
              <span className="hb-spinner" />
              {t('productModal.loading')}
            </div>
          ) : (
            <>
              <div className="hb-modal-form-toolbar">
                <Tabs variant="underline" tabs={mainTabs} active={tab} onChange={(id) => setTab(id as MainTabId)} />
              </div>

              <div className="hb-modal-product-layout">
                <div className="hb-modal-form-scroll">
                  <div className="hb-modal-form-main">
                    {tab === 'general' && (
                      <div className="hb-modal-section hb-modal-section--flush">
                        <FormField label={t('productModal.visibility')} hint={t('productModal.visibilityHint')}>
                          <div className="hb-segmented">
                            <button
                              type="button"
                              className={form.status !== 'draft' ? 'is-active' : ''}
                              onClick={() => updateForm({ status: 'publish' })}
                            >
                              {t('productModal.statusPublished')}
                            </button>
                            <button
                              type="button"
                              className={form.status === 'draft' ? 'is-active' : ''}
                              onClick={() => updateForm({ status: 'draft' })}
                            >
                              {t('productModal.statusDraft')}
                            </button>
                          </div>
                        </FormField>

                        <div className="hb-field-row hb-field-row--3">
                          <FormField label={t('productModal.price', { currency })}>
                            <div className="hb-price-input">
                              <span className="hb-price-input__currency">{currency}</span>
                              <input
                                className="hb-input hb-price-input__field"
                                value={String(form.price ?? '')}
                                onChange={(e) =>
                                  updateForm({ price: Number(e.target.value.replace(/[^0-9.,]/g, '') || 0) })
                                }
                                inputMode="decimal"
                                placeholder="0.00"
                              />
                            </div>
                          </FormField>
                          <FormField label={t('productModal.weight')}>
                            <input
                              className="hb-input"
                              value={form.weight}
                              onChange={(e) => updateForm({ weight: e.target.value })}
                              inputMode="numeric"
                            />
                          </FormField>
                          <FormField label={t('productModal.portion')}>
                            <input
                              className="hb-input"
                              value={form.portion_size}
                              onChange={(e) => updateForm({ portion_size: e.target.value })}
                              placeholder={t('productModal.portionPlaceholder')}
                            />
                          </FormField>
                        </div>

                        <div className="hb-field-row hb-field-row--3">
                          <FormField label={t('productModal.origin')}>
                            <input
                              className="hb-input"
                              value={form.origin_country}
                              onChange={(e) => updateForm({ origin_country: e.target.value })}
                              placeholder={t('productModal.originPlaceholder')}
                            />
                          </FormField>
                          <FormField label={t('productModal.spiceLevel')}>
                            <select
                              className="hb-input"
                              value={form.spice_level}
                              onChange={(e) => updateForm({ spice_level: e.target.value })}
                            >
                              {spiceLevels.map((level) => (
                                <option key={level.value || 'none'} value={level.value}>
                                  {level.label}
                                </option>
                              ))}
                            </select>
                          </FormField>
                          <FormField label={t('productModal.prepTime')}>
                            <input
                              className="hb-input"
                              value={form.preparation_time}
                              onChange={(e) => updateForm({ preparation_time: e.target.value })}
                              inputMode="numeric"
                            />
                          </FormField>
                        </div>

                        <FormField label={t('productModal.tags')}>
                          {tagGroups.map((group) => (
                            <div key={group.title} className="hb-tag-group">
                              <h4 className="hb-tag-group__title">{group.title}</h4>
                              <div className="hb-check-grid hb-check-grid--tags">
                                {group.tags.map((tag) => (
                                  <CheckboxCard
                                    key={tag.value}
                                    variant="chip"
                                    icon={tag.icon}
                                    label={tag.label}
                                    checked={normalizeStringArray(form.tags).includes(tag.value)}
                                    onChange={(checked) => {
                                      const tags = Array.isArray(form.tags) ? form.tags : [];
                                      updateForm({
                                        tags: checked
                                          ? [...tags, tag.value]
                                          : tags.filter((item) => item !== tag.value),
                                      });
                                    }}
                                  />
                                ))}
                              </div>
                            </div>
                          ))}
                        </FormField>
                      </div>
                    )}

                  {tab === 'content' && (
                    <div className="hb-modal-section">
                      <Tabs tabs={langTabs} active={langTab} onChange={setLangTab} />

                      <FormField
                        label={t('productModal.name')}
                        hint={titleError && langTab === defaultLang ? t('productModal.nameRequired') : undefined}
                      >
                        <input
                          className={`hb-input${titleError && langTab === defaultLang ? ' is-invalid' : ''}`}
                          value={currentLang?.title || ''}
                          onChange={(e) => updateLang(langTab, { title: e.target.value })}
                          placeholder={t('productModal.namePlaceholder')}
                        />
                      </FormField>

                      <FormField label={t('productModal.description')}>
                        <textarea
                          className="hb-input hb-input--compact"
                          value={currentLang?.description || ''}
                          onChange={(e) => updateLang(langTab, { description: e.target.value })}
                          rows={3}
                          placeholder={t('productModal.descriptionPlaceholder')}
                        />
                      </FormField>

                      <FormField label={t('productModal.ingredients')}>
                        <div className="hb-repeat-list">
                          {(currentLang?.ingredients || []).map((item, index) => (
                            <div key={index} className="hb-repeat-row">
                              <input
                                className="hb-input"
                                value={item.name}
                                onChange={(e) => {
                                  const ingredients = [...(currentLang?.ingredients || [])];
                                  ingredients[index] = { ...ingredients[index], name: e.target.value };
                                  updateLang(langTab, { ingredients });
                                }}
                                placeholder={t('productModal.ingredientName')}
                              />
                              <input
                                className="hb-input"
                                value={item.amount}
                                onChange={(e) => {
                                  const ingredients = [...(currentLang?.ingredients || [])];
                                  ingredients[index] = { ...ingredients[index], amount: e.target.value };
                                  updateLang(langTab, { ingredients });
                                }}
                                placeholder={t('productModal.ingredientAmount')}
                              />
                              <button
                                type="button"
                                className="button button-small hb-btn-danger"
                                onClick={() =>
                                  updateLang(langTab, {
                                    ingredients: (currentLang?.ingredients || []).filter((_, i) => i !== index),
                                  })
                                }
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            className="button button-small"
                            onClick={() =>
                              updateLang(langTab, {
                                ingredients: [...(currentLang?.ingredients || []), { name: '', amount: '' }],
                              })
                            }
                          >
                            {t('productModal.addIngredient')}
                          </button>
                        </div>
                      </FormField>

                      <FormField label={t('productModal.allergens')}>
                        <div className="hb-repeat-list">
                          {(currentLang?.allergens || []).map((item, index) => (
                            <div key={index} className="hb-repeat-row hb-repeat-row--2">
                              <input
                                className="hb-input"
                                value={item}
                                onChange={(e) => {
                                  const allergens = [...(currentLang?.allergens || [])];
                                  allergens[index] = e.target.value;
                                  updateLang(langTab, { allergens });
                                }}
                                placeholder={t('productModal.allergenName')}
                              />
                              <button
                                type="button"
                                className="button button-small hb-btn-danger"
                                onClick={() =>
                                  updateLang(langTab, {
                                    allergens: (currentLang?.allergens || []).filter((_, i) => i !== index),
                                  })
                                }
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            className="button button-small"
                            onClick={() =>
                              updateLang(langTab, { allergens: [...(currentLang?.allergens || []), ''] })
                            }
                          >
                            {t('productModal.addAllergen')}
                          </button>
                        </div>
                      </FormField>

                      <FormField label={t('productModal.allergenNotes')}>
                        <textarea
                          className="hb-input hb-input--compact"
                          value={currentLang?.allergen_notes || ''}
                          onChange={(e) => updateLang(langTab, { allergen_notes: e.target.value })}
                          rows={2}
                        />
                      </FormField>
                    </div>
                  )}

                  {tab === 'nutrition' && (
                    <div className="hb-modal-section">
                      <FormField label={t('productModal.nutrition')}>
                        <div className="hb-repeat-list">
                          {(form.nutrition || []).map((item, index) => (
                            <div key={index} className="hb-repeat-row">
                              <input
                                className="hb-input"
                                value={item.name}
                                onChange={(e) => {
                                  const nutrition = [...(form.nutrition || [])];
                                  nutrition[index] = { ...nutrition[index], name: e.target.value };
                                  updateForm({ nutrition });
                                }}
                                placeholder={t('productModal.nutritionName')}
                              />
                              <input
                                className="hb-input"
                                value={item.value}
                                onChange={(e) => {
                                  const nutrition = [...(form.nutrition || [])];
                                  nutrition[index] = { ...nutrition[index], value: e.target.value };
                                  updateForm({ nutrition });
                                }}
                                placeholder={t('productModal.nutritionValue')}
                              />
                              <button
                                type="button"
                                className="button button-small hb-btn-danger"
                                onClick={() =>
                                  updateForm({ nutrition: (form.nutrition || []).filter((_, i) => i !== index) })
                                }
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            className="button button-small"
                            onClick={() =>
                              updateForm({ nutrition: [...(form.nutrition || []), { name: '', value: '' }] })
                            }
                          >
                            {t('productModal.addNutrition')}
                          </button>
                        </div>
                      </FormField>

                      <FormField label={t('productModal.additives')}>
                        <div className="hb-repeat-list">
                          {(form.additives || []).map((item, index) => (
                            <div key={index} className="hb-repeat-row hb-repeat-row--2">
                              <input
                                className="hb-input"
                                value={item}
                                onChange={(e) => {
                                  const additives = [...(form.additives || [])];
                                  additives[index] = e.target.value;
                                  updateForm({ additives });
                                }}
                                placeholder={t('productModal.additivePlaceholder')}
                              />
                              <button
                                type="button"
                                className="button button-small hb-btn-danger"
                                onClick={() =>
                                  updateForm({ additives: (form.additives || []).filter((_, i) => i !== index) })
                                }
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            className="button button-small"
                            onClick={() => updateForm({ additives: [...(form.additives || []), ''] })}
                          >
                            {t('productModal.addAdditive')}
                          </button>
                        </div>
                      </FormField>
                    </div>
                  )}
                </div>
              </div>

                <aside className="hb-modal-product-aside">
                  <FormField label={t('productModal.image')}>
                    <ImageField
                      variant="inline"
                      value={form.image || ''}
                      hint={t('productModal.imageHint')}
                      onChange={(id, url) => {
                        setImageTouched(true);
                        updateForm({ image_id: id, image: url });
                      }}
                      onClear={() => {
                        setImageTouched(true);
                        updateForm({ image_id: 0, image: '' });
                      }}
                    />
                  </FormField>

                  <ProductPreviewCard
                    title={previewTitle}
                    description={previewDescription}
                    price={displayPrice}
                    currency={currency}
                    image={form.image || ''}
                    tags={previewTags}
                  />
                </aside>
              </div>
            </>
          )}
        </div>

        <div className="hb-modal__foot">
          <button type="button" className="button" onClick={onClose} disabled={saving}>
            {embedded ? t('common.back') : t('common.cancel')}
          </button>
          <button type="button" className="button button-primary" onClick={handleSave} disabled={saving || loading}>
            {saving ? t('common.saving') : mode === 'add' ? t('productModal.addBtn') : t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
