import type { ProStatus, SettingsData } from '../../api/client';
import { t } from '../../i18n';
import { FormField } from '../ui/FormField';
import { SectionCard } from '../ui/SectionCard';
import { Tabs } from '../ui/Tabs';
import { ProUpgradeCard } from './ProUpgradeCard';
import {
  CategoryNavPreview,
  HeaderStylePreview,
  ListStylePreview,
  MenuEntryPreview,
  MenuViewPreview,
} from './MenuDisplayPreviews';

interface Props {
  settings: SettingsData;
  onChange: (updater: (current: SettingsData) => SettingsData) => void;
  pro?: ProStatus;
}

const VIEW_MODES = [
  { id: 'list' as const, labelKey: 'menuDisplay.viewList', descKey: 'menuDisplay.viewListDesc' },
  { id: 'bento' as const, labelKey: 'menuDisplay.viewBento', descKey: 'menuDisplay.viewBentoDesc' },
];

const LIST_STYLES = [
  { id: 'classic' as const, labelKey: 'menuDisplay.listClassic', descKey: 'menuDisplay.listClassicDesc' },
  { id: 'compact' as const, labelKey: 'menuDisplay.listCompact', descKey: 'menuDisplay.listCompactDesc' },
  { id: 'card' as const, labelKey: 'menuDisplay.listCard', descKey: 'menuDisplay.listCardDesc' },
];

const CATEGORY_NAV_MODES = [
  { id: 'tabs' as const, labelKey: 'menuDisplay.categoryTabs', descKey: 'menuDisplay.categoryTabsDesc' },
  { id: 'scroll' as const, labelKey: 'menuDisplay.categoryScroll', descKey: 'menuDisplay.categoryScrollDesc' },
];

const MENU_ENTRY_MODES = [
  { id: 'direct' as const, labelKey: 'menuDisplay.entryDirect', descKey: 'menuDisplay.entryDirectDesc' },
  { id: 'categories' as const, labelKey: 'menuDisplay.entryCategories', descKey: 'menuDisplay.entryCategoriesDesc' },
];

const HEADER_STYLES = [
  { id: 'classic' as const, labelKey: 'menuDisplay.headerClassic', descKey: 'menuDisplay.headerClassicDesc' },
  { id: 'centered' as const, labelKey: 'menuDisplay.headerCentered', descKey: 'menuDisplay.headerCenteredDesc' },
];

function mergeMenuDisplay(
  current: SettingsData,
  patch: Partial<NonNullable<SettingsData['menu_display']>>,
): SettingsData['menu_display'] {
  return {
    default_view_mode: current.menu_display?.default_view_mode || 'list',
    list_style: current.menu_display?.list_style || 'classic',
    category_nav_mode: current.menu_display?.category_nav_mode || 'tabs',
    menu_entry_mode: current.menu_display?.menu_entry_mode || 'direct',
    header_style: current.menu_display?.header_style || 'classic',
    stories_enabled: current.menu_display?.stories_enabled === '1' ? '1' : '0',
    ...patch,
  };
}

export function MenuDisplaySection({ settings, onChange, pro }: Props) {
  const colorMode = settings.theme_editor_mode || 'light';
  const modeTabs = [
    { id: 'light', label: t('theme.modeLight'), icon: '☀️' },
    { id: 'dark', label: t('theme.modeDark'), icon: '🌙' },
  ] as const;

  const menuDisplay = settings.menu_display || {
    default_view_mode: 'list',
    list_style: 'classic',
    category_nav_mode: 'tabs',
    menu_entry_mode: 'direct',
    header_style: 'classic',
    stories_enabled: '0',
  };

  const setViewMode = (default_view_mode: 'list' | 'bento') => {
    onChange((current) => ({
      ...current,
      menu_display: mergeMenuDisplay(current, { default_view_mode }),
    }));
  };

  const setListStyle = (list_style: 'classic' | 'compact' | 'card') => {
    onChange((current) => ({
      ...current,
      menu_display: mergeMenuDisplay(current, { list_style }),
    }));
  };

  const setCategoryNavMode = (category_nav_mode: 'tabs' | 'scroll') => {
    onChange((current) => ({
      ...current,
      menu_display: mergeMenuDisplay(current, { category_nav_mode }),
    }));
  };

  const setMenuEntryMode = (menu_entry_mode: 'direct' | 'categories') => {
    onChange((current) => ({
      ...current,
      menu_display: mergeMenuDisplay(current, { menu_entry_mode }),
    }));
  };

  const setHeaderStyle = (header_style: 'classic' | 'centered') => {
    onChange((current) => ({
      ...current,
      menu_display: mergeMenuDisplay(current, { header_style }),
    }));
  };

  const setStoriesEnabled = (enabled: boolean) => {
    onChange((current) => ({
      ...current,
      menu_display: mergeMenuDisplay(current, { stories_enabled: enabled ? '1' : '0' }),
    }));
  };

  const storiesEnabled = menuDisplay.stories_enabled === '1';
  const proStatus: ProStatus = pro || settings.pro || {
    is_pro: false,
    checkout_url:
      'https://happybites.io/checkout?utm_source=happybites-plugin&utm_medium=admin-upsell&utm_campaign=pro-checkout',
    features: { mcp: false, custom_design: false, stories: false },
  };
  const canStories = proStatus.is_pro || proStatus.features.stories;

  const headerOverlay = {
    light: settings.colors.appearance?.header_overlay?.light ?? 65,
    dark: settings.colors.appearance?.header_overlay?.dark ?? 70,
  };

  const updateHeaderOverlay = (mode: 'light' | 'dark', value: number) => {
    onChange((current) => ({
      ...current,
      colors: {
        ...current.colors,
        appearance: {
          theme_color: {
            light:
              current.colors.appearance?.theme_color?.light ||
              current.colors.light?.background ||
              '#ffffff',
            dark:
              current.colors.appearance?.theme_color?.dark ||
              current.colors.dark?.background ||
              '#121212',
          },
          header_overlay: {
            light: current.colors.appearance?.header_overlay?.light ?? 65,
            dark: current.colors.appearance?.header_overlay?.dark ?? 70,
            [mode]: value,
          },
        },
      },
    }));
  };

  return (
    <>
      <SectionCard title={t('menuDisplay.storiesTitle')} description={t('menuDisplay.storiesDesc')}>
        {!canStories ? (
          <ProUpgradeCard
            pro={proStatus}
            title={t('pro.storiesTitle')}
            description={t('pro.storiesDesc')}
          />
        ) : (
          <>
            <label className="hb-checkbox-row">
              <input
                type="checkbox"
                checked={storiesEnabled}
                onChange={(e) => setStoriesEnabled(e.target.checked)}
              />
              <span>{t('menuDisplay.storiesToggle')}</span>
            </label>
            <p className="hb-field-hint">{t('menuDisplay.storiesHint')}</p>
          </>
        )}
      </SectionCard>

      <SectionCard title={t('menuDisplay.headerTitle')} description={t('menuDisplay.headerDesc')}>
        <div className="hb-menu-display-options">
          {HEADER_STYLES.map((style) => (
            <button
              key={style.id}
              type="button"
              className={`hb-menu-display-option${menuDisplay.header_style === style.id ? ' is-active' : ''}`}
              onClick={() => setHeaderStyle(style.id)}
            >
              <HeaderStylePreview variant={style.id} />
              <span className="hb-menu-display-option__label">{t(style.labelKey)}</span>
              <span className="hb-menu-display-option__desc">{t(style.descKey)}</span>
            </button>
          ))}
        </div>
        <p className="hb-field-hint">{t('menuDisplay.headerHint')}</p>

        <div className="hb-menu-header-appearance">
          <div className="hb-theme-editor-toolbar">
            <Tabs
              variant="underline"
              tabs={[...modeTabs]}
              active={colorMode}
              onChange={(id) => onChange((c) => ({ ...c, theme_editor_mode: id as 'light' | 'dark' }))}
            />
          </div>

          <FormField
            label={t('theme.overlay')}
            hint={t('theme.overlayHint', { n: headerOverlay[colorMode] })}
          >
            <input
              type="range"
              className="hb-input"
              min={0}
              max={100}
              step={5}
              value={headerOverlay[colorMode]}
              onChange={(e) => updateHeaderOverlay(colorMode, Number(e.target.value))}
            />
          </FormField>
        </div>
      </SectionCard>

      <SectionCard title={t('menuDisplay.entryTitle')} description={t('menuDisplay.entryDesc')}>
        <div className="hb-menu-display-options">
          {MENU_ENTRY_MODES.map((mode) => (
            <button
              key={mode.id}
              type="button"
              className={`hb-menu-display-option${menuDisplay.menu_entry_mode === mode.id ? ' is-active' : ''}`}
              onClick={() => setMenuEntryMode(mode.id)}
            >
              <MenuEntryPreview variant={mode.id} />
              <span className="hb-menu-display-option__label">{t(mode.labelKey)}</span>
              <span className="hb-menu-display-option__desc">{t(mode.descKey)}</span>
            </button>
          ))}
        </div>
        <p className="hb-field-hint">{t('menuDisplay.entryHint')}</p>
      </SectionCard>

      <SectionCard title={t('menuDisplay.viewTitle')} description={t('menuDisplay.viewDesc')}>
        <div className="hb-menu-display-options">
          {VIEW_MODES.map((mode) => (
            <button
              key={mode.id}
              type="button"
              className={`hb-menu-display-option${menuDisplay.default_view_mode === mode.id ? ' is-active' : ''}`}
              onClick={() => setViewMode(mode.id)}
            >
              <MenuViewPreview variant={mode.id} />
              <span className="hb-menu-display-option__label">{t(mode.labelKey)}</span>
              <span className="hb-menu-display-option__desc">{t(mode.descKey)}</span>
            </button>
          ))}
        </div>
        <p className="hb-field-hint">{t('menuDisplay.viewHint')}</p>
      </SectionCard>

      <SectionCard title={t('menuDisplay.listTitle')} description={t('menuDisplay.listDesc')}>
        <div className="hb-menu-display-options hb-menu-display-options--three">
          {LIST_STYLES.map((style) => (
            <button
              key={style.id}
              type="button"
              className={`hb-menu-display-option${menuDisplay.list_style === style.id ? ' is-active' : ''}`}
              onClick={() => setListStyle(style.id)}
            >
              <ListStylePreview variant={style.id} />
              <span className="hb-menu-display-option__label">{t(style.labelKey)}</span>
              <span className="hb-menu-display-option__desc">{t(style.descKey)}</span>
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard title={t('menuDisplay.categoryNavTitle')} description={t('menuDisplay.categoryNavDesc')}>
        <div className="hb-menu-display-options">
          {CATEGORY_NAV_MODES.map((mode) => (
            <button
              key={mode.id}
              type="button"
              className={`hb-menu-display-option${menuDisplay.category_nav_mode === mode.id ? ' is-active' : ''}`}
              onClick={() => setCategoryNavMode(mode.id)}
            >
              <CategoryNavPreview variant={mode.id} />
              <span className="hb-menu-display-option__label">{t(mode.labelKey)}</span>
              <span className="hb-menu-display-option__desc">{t(mode.descKey)}</span>
            </button>
          ))}
        </div>
        <p className="hb-field-hint">{t('menuDisplay.categoryNavHint')}</p>
      </SectionCard>
    </>
  );
}
