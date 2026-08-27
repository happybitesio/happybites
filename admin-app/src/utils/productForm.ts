import type { LocalizedProductFields, ProductDetails, ProductPayload } from '../api/client';
import { getConfig } from '../api/client';
import { tspice } from '../i18n';
import { normalizeLanguages, normalizeProductDetails } from './normalize';

export function getSpiceLevels(): Array<{ value: string; label: string }> {
  return [
    { value: '', label: tspice('select') },
    { value: '0', label: tspice('0') },
    { value: '1', label: tspice('1') },
    { value: '2', label: tspice('2') },
    { value: '3', label: tspice('3') },
  ];
}

export function getActiveLanguages(): string[] {
  return normalizeLanguages(getConfig().settings.languages);
}

export function emptyLocalizedFields(): LocalizedProductFields {
  return {
    title: '',
    description: '',
    ingredients: [],
    allergens: [],
    allergen_notes: '',
  };
}

export function createEmptyProduct(categoryId = 0): ProductDetails {
  const languages = getActiveLanguages();
  const localized: Record<string, LocalizedProductFields> = {};

  languages.forEach((code) => {
    localized[code] = emptyLocalizedFields();
  });

  return {
    id: undefined,
    title: '',
    description: '',
    price: 0,
    status: 'publish',
    tags: [],
    category_id: categoryId,
    image: '',
    image_id: 0,
    languages: localized,
    weight: '',
    origin_country: '',
    spice_level: '',
    preparation_time: '',
    portion_size: '',
    nutrition: [],
    additives: [],
  };
}

export function toProductPayload(
  form: ProductDetails,
  options: { imageTouched: boolean },
): ProductPayload {
  const defaultLang = getConfig().settings.default_language || getActiveLanguages()[0] || 'en';
  const defaultFields = form.languages[defaultLang] || emptyLocalizedFields();

  return {
    title: defaultFields.title || form.title || '',
    description: defaultFields.description || form.description || '',
    price: Number(form.price || 0),
    category_id: form.category_id || 0,
    status: form.status === 'draft' ? 'draft' : 'publish',
    tags: form.tags || [],
    languages: form.languages,
    weight: form.weight || '',
    origin_country: form.origin_country || '',
    spice_level: form.spice_level || '',
    preparation_time: form.preparation_time || '',
    portion_size: form.portion_size || '',
    nutrition: form.nutrition || [],
    additives: form.additives || [],
    image_id: form.image_id || 0,
    image_touched: options.imageTouched,
  };
}

export function mergeProductDetails(
  base: Partial<ProductDetails>,
  loaded: ProductDetails,
): ProductDetails {
  const languages = getActiveLanguages();
  const normalized = normalizeProductDetails(loaded, languages);

  return normalizeProductDetails(
    {
      ...createEmptyProduct(base.category_id || 0),
      ...normalized,
      ...base,
      id: normalized.id ?? base.id,
      category_id: base.category_id ?? normalized.category_id,
    },
    languages,
  );
}
