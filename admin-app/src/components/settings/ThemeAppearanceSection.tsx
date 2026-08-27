import type { ProStatus, SettingsData, ThemeAppearance } from '../../api/client';
import { t } from '../../i18n';
import { ProUpgradeCard } from './ProUpgradeCard';
import { MenuDisplaySection } from './MenuDisplaySection';
import { FormField } from '../ui/FormField';
import { SectionCard } from '../ui/SectionCard';
import { Tabs } from '../ui/Tabs';

interface Props {
  settings: SettingsData;
  onChange: (updater: (current: SettingsData) => SettingsData) => void;
  pro?: ProStatus;
}

export function ThemeAppearanceSection({ settings, onChange, pro }: Props) {
  const isPro = pro?.is_pro ?? false;
  const proStatus: ProStatus = pro || {
    is_pro: false,
    checkout_url:
      'https://happybites.io/checkout?utm_source=happybites-plugin&utm_medium=admin-upsell&utm_campaign=pro-checkout',
    features: { mcp: false, custom_design: false, stories: false },
  };
  const colorMode = settings.theme_editor_mode || 'light';

  const modeTabs = [
    { id: 'light', label: t('theme.modeLight'), icon: '☀️' },
    { id: 'dark', label: t('theme.modeDark'), icon: '🌙' },
  ] as const;

  const applyPreset = (presetId: string) => {
    const palettes = settings.theme_preset_palettes?.[presetId];
    if (!palettes) return;

    onChange((current) => ({
      ...current,
      colors: {
        ...current.colors,
        preset: presetId,
        active_color: palettes.light.primary,
        accent_color: palettes.light.accent,
        light: { ...palettes.light },
        dark: { ...palettes.dark },
      },
    }));
  };

  const appearance: ThemeAppearance = {
    theme_color: {
      light: settings.colors.appearance?.theme_color?.light || settings.colors.light?.background || '#ffffff',
      dark: settings.colors.appearance?.theme_color?.dark || settings.colors.dark?.background || '#121212',
    },
    header_overlay: {
      light: settings.colors.appearance?.header_overlay?.light ?? 65,
      dark: settings.colors.appearance?.header_overlay?.dark ?? 70,
    },
  };

  const updateThemeColor = (mode: 'light' | 'dark', value: string) => {
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
            [mode]: value,
          },
          header_overlay: {
            light: current.colors.appearance?.header_overlay?.light ?? 65,
            dark: current.colors.appearance?.header_overlay?.dark ?? 70,
          },
        },
      },
    }));
  };

  return (
    <>
      {!isPro ? (
        <ProUpgradeCard
          pro={proStatus}
          title={t('pro.themeTitle')}
          description={t('pro.themeDesc')}
        />
      ) : null}

      <SectionCard title={t('theme.presetsTitle')} description={t('theme.presetsDesc')}>
        <div className="hb-theme-presets">
          {(settings.theme_presets || []).map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={`hb-theme-preset${settings.colors.preset === preset.id ? ' is-active' : ''}`}
              onClick={() => applyPreset(preset.id)}
            >
              <span className="hb-theme-preset__swatch" style={{ background: preset.swatch }} />
              <span className="hb-theme-preset__swatch hb-theme-preset__swatch--accent" style={{ background: preset.swatch_accent || preset.swatch }} />
              <span className="hb-theme-preset__name">{preset.name}</span>
              <span className="hb-theme-preset__desc">{preset.description}</span>
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard title={t('theme.modeTitle')} description={t('theme.modeDesc')}>
        <FormField label={t('theme.modeStart')} hint={t('theme.modeHint')}>
          <select
            className="hb-input"
            value={settings.theme_mode.mode || 'light'}
            onChange={(e) => onChange((c) => ({ ...c, theme_mode: { mode: e.target.value } }))}
          >
            <option value="light">{t('theme.modeLight')}</option>
            <option value="dark">{t('theme.modeDark')}</option>
          </select>
        </FormField>
      </SectionCard>

      <MenuDisplaySection settings={settings} onChange={onChange} pro={proStatus} />

      <SectionCard title={t('theme.browserTitle')} description={t('theme.browserDesc')}>
        <div className="hb-theme-editor-toolbar">
          <Tabs
            variant="underline"
            tabs={[...modeTabs]}
            active={colorMode}
            onChange={(id) => onChange((c) => ({ ...c, theme_editor_mode: id as 'light' | 'dark' }))}
          />
        </div>

        <FormField label={t('theme.themeColor')} hint={t('theme.themeColorHint')}>
          <div className="hb-color-row">
            <input
              type="color"
              value={appearance.theme_color[colorMode]}
              onChange={(e) => updateThemeColor(colorMode, e.target.value)}
            />
            <span className="hb-color-value">{appearance.theme_color[colorMode]}</span>
          </div>
        </FormField>
      </SectionCard>
    </>
  );
}
