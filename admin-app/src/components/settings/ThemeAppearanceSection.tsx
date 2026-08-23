import { useState } from 'react';
import type { SettingsData, ThemeAppearance, ThemePalette } from '../../api/client';
import { generateThemeFromLogoUrl } from '../../utils/logoThemeExtractor';
import { Alert } from '../ui/Alert';
import { FormField } from '../ui/FormField';
import { SectionCard } from '../ui/SectionCard';
import { Tabs } from '../ui/Tabs';

const PALETTE_LABELS: Record<string, string> = {
  background: 'Arka Plan',
  surface: 'Kart / Yüzey',
  text: 'Ana Metin',
  text_muted: 'İkincil Metin',
  primary: 'Ana Renk',
  accent: 'Vurgu Rengi',
  border: 'Kenarlık',
  header: 'Üst Bar',
};

const MODE_TABS = [
  { id: 'light', label: 'Açık Tema', icon: '☀️' },
  { id: 'dark', label: 'Koyu Tema', icon: '🌙' },
] as const;

interface Props {
  settings: SettingsData;
  onChange: (updater: (current: SettingsData) => SettingsData) => void;
}

export function ThemeAppearanceSection({ settings, onChange }: Props) {
  const colorMode = settings.theme_editor_mode || 'light';
  const isCustom = settings.colors.preset === 'custom';
  const activePalette = colorMode === 'dark' ? settings.colors.dark : settings.colors.light;
  const logoUrl = String(settings.restaurant_info?.logo_url || '').trim();
  const [logoThemeLoading, setLogoThemeLoading] = useState(false);
  const [logoThemeMessage, setLogoThemeMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [logoThemeSamples, setLogoThemeSamples] = useState<string[]>([]);

  const applyGeneratedTheme = (light: ThemePalette, dark: ThemePalette, samples: string[]) => {
    onChange((current) => ({
      ...current,
      colors: {
        ...current.colors,
        preset: 'custom',
        active_color: light.primary,
        accent_color: light.accent,
        light: { ...light },
        dark: { ...dark },
      },
      theme_editor_mode: 'light',
    }));
    setLogoThemeSamples(samples);
  };

  const generateThemeFromLogo = async () => {
    if (!logoUrl) {
      setLogoThemeMessage({ type: 'error', text: 'Önce Genel sekmesinden bir logo seçin.' });
      return;
    }

    setLogoThemeLoading(true);
    setLogoThemeMessage(null);

    try {
      const result = await generateThemeFromLogoUrl(logoUrl);
      applyGeneratedTheme(result.light, result.dark, result.samples);
      setLogoThemeMessage({
        type: 'success',
        text: 'Logo renklerinden özel tema oluşturuldu. Kaydetmeden önce önizlemeyi kontrol edin.',
      });
    } catch {
      setLogoThemeMessage({
        type: 'error',
        text: 'Logodan renk çıkarılamadı. Farklı bir görsel deneyin veya renkleri manuel düzenleyin.',
      });
    } finally {
      setLogoThemeLoading(false);
    }
  };

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

  const updateAppearance = (
    mode: 'light' | 'dark',
    key: 'theme_color' | 'header_overlay',
    value: string | number,
  ) => {
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
            ...(key === 'theme_color' ? { [mode]: value as string } : {}),
          },
          header_overlay: {
            light: current.colors.appearance?.header_overlay?.light ?? 65,
            dark: current.colors.appearance?.header_overlay?.dark ?? 70,
            ...(key === 'header_overlay' ? { [mode]: value as number } : {}),
          },
        },
      },
    }));
  };

  const updatePaletteColor = (mode: 'light' | 'dark', key: keyof ThemePalette, value: string) => {
    onChange((current) => {
      const nextPalette = {
        ...(current.colors[mode] || {}),
        [key]: value,
      } as ThemePalette;

      const nextColors = {
        ...current.colors,
        preset: 'custom',
        [mode]: nextPalette,
      };

      if (mode === 'light') {
        if (key === 'primary') nextColors.active_color = value;
        if (key === 'accent') nextColors.accent_color = value;
      }

      return { ...current, colors: nextColors };
    });
  };

  return (
    <>
      <SectionCard
        title="Logodan Tema Oluştur"
        description="Yüklediğiniz logodan otomatik renk paleti çıkarır ve özel tema olarak uygular."
      >
        {logoThemeMessage ? (
          <Alert type={logoThemeMessage.type} onDismiss={() => setLogoThemeMessage(null)}>
            {logoThemeMessage.text}
          </Alert>
        ) : null}

        {logoUrl ? (
          <div className="hb-logo-theme">
            <img src={logoUrl} alt="Restoran logosu" className="hb-logo-theme__preview" />
            <div className="hb-logo-theme__actions">
              <button
                type="button"
                className="button button-primary"
                onClick={generateThemeFromLogo}
                disabled={logoThemeLoading}
              >
                {logoThemeLoading ? 'Tema oluşturuluyor...' : 'Logodan Tema Oluştur'}
              </button>
              <p className="hb-logo-theme__hint">
                Tema oluşturulduktan sonra aşağıdaki önizlemeden düzenleyebilir ve kaydedebilirsiniz.
              </p>
            </div>
          </div>
        ) : (
          <p className="hb-logo-theme__empty">Logo seçmek için Genel sekmesine gidin.</p>
        )}

        {logoThemeSamples.length > 0 ? (
          <div className="hb-logo-theme__samples">
            <span className="hb-logo-theme__samples-label">Çıkarılan renkler</span>
            <div className="hb-logo-theme__samples-row">
              {logoThemeSamples.map((color) => (
                <div key={color} className="hb-logo-theme__sample" title={color}>
                  <span style={{ background: color }} />
                  <small>{color}</small>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </SectionCard>

      <SectionCard title="Tema Paketleri" description="Hazır renk paletlerinden birini seçin veya özelleştirin.">
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

      <SectionCard title="Varsayılan Tema Modu" description="Menü ilk açıldığında hangi mod kullanılsın?">
        <FormField label="Başlangıç Modu" hint="Ziyaretçiler header'dan mod değiştirebilir.">
          <select
            className="hb-input"
            value={settings.theme_mode.mode || 'light'}
            onChange={(e) => onChange((c) => ({ ...c, theme_mode: { mode: e.target.value } }))}
          >
            <option value="light">Açık Tema</option>
            <option value="dark">Koyu Tema</option>
          </select>
        </FormField>
      </SectionCard>

      <SectionCard
        title="Tarayıcı ve Kapak"
        description="Safari/Chrome üst çubuğu rengi ve kapak fotoğrafı üzerindeki karartma yoğunluğu."
      >
        <div className="hb-theme-editor-toolbar">
          <Tabs
            variant="underline"
            tabs={[...MODE_TABS]}
            active={colorMode}
            onChange={(id) => onChange((c) => ({ ...c, theme_editor_mode: id as 'light' | 'dark' }))}
          />
        </div>

        <FormField
          label="Tarayıcı tema rengi (theme-color)"
          hint="Safari ve Chrome üst/alt bant rengi. Açık ve koyu mod için ayrı ayarlayın."
        >
          <div className="hb-color-row">
            <input
              type="color"
              value={appearance.theme_color[colorMode]}
              onChange={(e) => updateAppearance(colorMode, 'theme_color', e.target.value)}
            />
            <span className="hb-color-value">{appearance.theme_color[colorMode]}</span>
          </div>
        </FormField>

        <FormField
          label="Kapak overlay koyuluğu"
          hint={`Kapak fotoğrafı üzerindeki karartma: %${appearance.header_overlay[colorMode]}`}
        >
          <input
            type="range"
            className="hb-input"
            min={0}
            max={100}
            step={5}
            value={appearance.header_overlay[colorMode]}
            onChange={(e) => updateAppearance(colorMode, 'header_overlay', Number(e.target.value))}
          />
        </FormField>
      </SectionCard>

      <SectionCard
        title="Renk Özelleştirme"
        description={isCustom ? 'Tüm renkleri ayrı ayrı düzenleyebilirsiniz.' : 'Preset seçili. Özelleştirmek için bir rengi değiştirin veya Custom paketini seçin.'}
      >
        <div className="hb-theme-editor-toolbar">
          <Tabs
            variant="underline"
            tabs={[...MODE_TABS]}
            active={colorMode}
            onChange={(id) => onChange((c) => ({ ...c, theme_editor_mode: id as 'light' | 'dark' }))}
          />
        </div>

        <div className="hb-theme-preview" style={{ background: activePalette?.background, borderColor: activePalette?.border }}>
          <div className="hb-theme-preview__header" style={{ background: activePalette?.header, borderColor: activePalette?.border }}>
            <span style={{ color: activePalette?.primary }}>●</span>
            <span style={{ color: activePalette?.text }}>Menü Önizleme</span>
          </div>
          <div className="hb-theme-preview__body">
            <div className="hb-theme-preview__card" style={{ background: activePalette?.surface, borderColor: activePalette?.border }}>
              <strong style={{ color: activePalette?.text }}>Ürün Adı</strong>
              <p style={{ color: activePalette?.text_muted }}>Açıklama metni</p>
              <span style={{ color: activePalette?.accent }}>₺120</span>
            </div>
            <button type="button" className="hb-theme-preview__btn" style={{ background: activePalette?.primary, color: '#fff' }}>
              Kategori
            </button>
          </div>
        </div>

        <div className="hb-theme-color-grid">
          {(settings.palette_keys || Object.keys(PALETTE_LABELS)).map((key) => (
            <FormField key={key} label={PALETTE_LABELS[key] || key}>
              <div className="hb-color-row">
                <input
                  type="color"
                  value={activePalette?.[key as keyof ThemePalette] || '#000000'}
                  onChange={(e) => updatePaletteColor(colorMode, key as keyof ThemePalette, e.target.value)}
                />
                <span className="hb-color-value">{activePalette?.[key as keyof ThemePalette]}</span>
              </div>
            </FormField>
          ))}
        </div>
      </SectionCard>
    </>
  );
}
