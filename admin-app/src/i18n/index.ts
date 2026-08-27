import ar from './ar';
import de from './de';
import en from './en';
import es from './es';
import fr from './fr';
import it from './it';
import ja from './ja';
import ko from './ko';
import pt from './pt';
import ro from './ro';
import ru from './ru';
import tr from './tr';
import zh from './zh';

export type AdminLocale =
  | 'tr'
  | 'en'
  | 'de'
  | 'fr'
  | 'es'
  | 'pt'
  | 'it'
  | 'ru'
  | 'ar'
  | 'zh'
  | 'ja'
  | 'ko'
  | 'ro';

const LOCALE_MAP: Record<string, AdminLocale> = {
  tr: 'tr',
  en: 'en',
  de: 'de',
  fr: 'fr',
  es: 'es',
  pt: 'pt',
  it: 'it',
  ru: 'ru',
  ar: 'ar',
  zh: 'zh',
  ja: 'ja',
  ko: 'ko',
  ro: 'ro',
};

const catalogs: Record<AdminLocale, typeof en> = {
  en,
  tr,
  de,
  fr,
  es,
  pt,
  it,
  ru,
  ar,
  zh,
  ja,
  ko,
  ro,
};

let locale: AdminLocale = 'en';

export function normalizeLocale(value?: string): AdminLocale {
  if (!value) {
    return 'en';
  }

  const short = value.split(/[-_]/)[0].toLowerCase();
  return LOCALE_MAP[short] ?? 'en';
}

export function initFromConfig(config?: { locale?: string }): void {
  locale = normalizeLocale(config?.locale);
}

export function getAdminLocale(): AdminLocale {
  return locale;
}

function resolve(path: string, source: Record<string, unknown>): string | undefined {
  const parts = path.split('.');
  let current: unknown = source;

  for (const part of parts) {
    if (!current || typeof current !== 'object' || !(part in current)) {
      return undefined;
    }

    current = (current as Record<string, unknown>)[part];
  }

  return typeof current === 'string' ? current : undefined;
}

export function t(path: string, vars?: Record<string, string | number>): string {
  const catalog = catalogs[locale] as unknown as Record<string, unknown>;
  const fallback = catalogs.en as unknown as Record<string, unknown>;
  let value = resolve(path, catalog) ?? resolve(path, fallback) ?? path;

  if (vars) {
    for (const [key, val] of Object.entries(vars)) {
      value = value.replaceAll(`{${key}}`, String(val));
    }
  }

  return value;
}

export function tpalette(key: string): string {
  return t(`theme.palette.${key}`);
}

export function tday(key: string): string {
  return t(`days.${key}`);
}

export function tlanguage(code: string): string {
  return t(`languages.${code}`) || code;
}

export function tspice(level: string): string {
  return t(`spiceLevels.${level}`);
}
