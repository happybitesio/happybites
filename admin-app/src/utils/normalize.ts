import type {
  LocalizedProductFields,
  ProductDetails,
  ProductIngredient,
  ProductNutrition,
} from '../api/client';

export function normalizeLanguages(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String).filter(Boolean);
  }

  if (typeof value === 'string' && value.trim() !== '') {
    return [value.trim()];
  }

  if (value && typeof value === 'object') {
    return Object.values(value as Record<string, unknown>)
      .map(String)
      .filter(Boolean);
  }

  return ['en'];
}

export function normalizeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String).filter((item) => item.trim() !== '');
  }

  if (typeof value === 'string' && value.trim() !== '') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

export function normalizeIngredients(value: unknown): ProductIngredient[] {
  if (!value) return [];

  const list = Array.isArray(value) ? value : Object.values(value as Record<string, unknown>);

  return list
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const row = item as Record<string, unknown>;
      const name = String(row.name ?? '').trim();
      if (!name) return null;
      return {
        name,
        amount: String(row.amount ?? '').trim(),
      };
    })
    .filter((item): item is ProductIngredient => item !== null);
}

export function normalizeNutrition(value: unknown): ProductNutrition[] {
  if (!value) return [];

  const list = Array.isArray(value) ? value : Object.values(value as Record<string, unknown>);

  return list
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const row = item as Record<string, unknown>;
      const name = String(row.name ?? '').trim();
      if (!name) return null;
      return {
        name,
        value: String(row.value ?? '').trim(),
      };
    })
    .filter((item): item is ProductNutrition => item !== null);
}

export function normalizeLocalizedFields(value: unknown): LocalizedProductFields {
  const row = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

  return {
    title: String(row.title ?? ''),
    description: String(row.description ?? ''),
    ingredients: normalizeIngredients(row.ingredients),
    allergens: normalizeStringArray(row.allergens),
    allergen_notes: String(row.allergen_notes ?? ''),
  };
}

export function normalizeLanguagesMap(value: unknown, languageCodes: string[]): Record<string, LocalizedProductFields> {
  const source = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  const map: Record<string, LocalizedProductFields> = {};

  languageCodes.forEach((code) => {
    map[code] = normalizeLocalizedFields(source[code]);
  });

  return map;
}

export function normalizeProductDetails(
  value: Partial<ProductDetails>,
  languageCodes?: string[],
): ProductDetails {
  const languages = languageCodes || normalizeLanguages(value.languages);

  return {
    id: value.id,
    title: String(value.title ?? ''),
    description: String(value.description ?? ''),
    price: Number(value.price ?? 0),
    order: value.order,
    status: value.status === 'draft' ? 'draft' : 'publish',
    image: String(value.image ?? ''),
    image_id: Number(value.image_id ?? 0),
    tags: normalizeStringArray(value.tags),
    category_id: Number(value.category_id ?? 0),
    languages: normalizeLanguagesMap(value.languages, languages),
    weight: String(value.weight ?? ''),
    origin_country: String(value.origin_country ?? ''),
    spice_level: String(value.spice_level ?? ''),
    preparation_time: String(value.preparation_time ?? ''),
    portion_size: String(value.portion_size ?? ''),
    nutrition: normalizeNutrition(value.nutrition),
    additives: normalizeStringArray(value.additives),
  };
}
