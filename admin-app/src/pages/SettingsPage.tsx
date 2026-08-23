import { useEffect, useState } from 'react';
import { api, type SettingsData } from '../api/client';
import { openMediaFrame } from '../utils/media';
import { Alert } from '../components/ui/Alert';
import { CheckboxCard } from '../components/ui/CheckboxCard';
import { FormField } from '../components/ui/FormField';
import { PageHeader } from '../components/ui/PageHeader';
import { SectionCard } from '../components/ui/SectionCard';
import { Tabs } from '../components/ui/Tabs';
import { ThemeAppearanceSection } from '../components/settings/ThemeAppearanceSection';
import { McpSettingsSection } from '../components/settings/McpSettingsSection';
import { MenuQrCode } from '../components/settings/MenuQrCode';
import { Toggle } from '../components/ui/Toggle';
import { WordPressHtmlEditor } from '../components/ui/WordPressHtmlEditor';
import { normalizeWorkingHours, WORKING_DAYS } from '../utils/workingHours';

const TABS = [
  { id: 'general', label: 'Genel', icon: '🏪' },
  { id: 'languages', label: 'Diller', icon: '🌐' },
  { id: 'hours', label: 'Çalışma Saatleri', icon: '🕐' },
  { id: 'appearance', label: 'Görünüm', icon: '🎨' },
  { id: 'social', label: 'Sosyal & WiFi', icon: '📱' },
  { id: 'advanced', label: 'Ek Bilgi', icon: '📝' },
  { id: 'security', label: 'Güvenlik', icon: '🛡️' },
  { id: 'mcp', label: 'MCP', icon: '🔌' },
] as const;

const DAYS = WORKING_DAYS;
const DAY_LABELS: Record<string, string> = {
  monday: 'Pazartesi',
  tuesday: 'Salı',
  wednesday: 'Çarşamba',
  thursday: 'Perşembe',
  friday: 'Cuma',
  saturday: 'Cumartesi',
  sunday: 'Pazar',
};

const LANGUAGES: Record<string, string> = {
  tr: 'Türkçe',
  en: 'English',
  de: 'Deutsch',
  fr: 'Français',
  es: 'Español',
  pt: 'Português',
  it: 'Italiano',
  ru: 'Русский',
  ar: 'العربية',
  zh: '中文',
  ja: '日本語',
  ko: '한국어',
  ro: 'Română',
};

const SOCIAL_KEYS = [
  { key: 'facebook', label: 'Facebook' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'twitter', label: 'Twitter / X' },
  { key: 'whatsapp', label: 'WhatsApp' },
  { key: 'youtube', label: 'YouTube' },
  { key: 'tiktok', label: 'TikTok' },
  { key: 'linkedin', label: 'LinkedIn' },
  { key: 'tripadvisor', label: 'TripAdvisor' },
  { key: 'google_business', label: 'Google Business' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<TabId>('general');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    api
      .getSettings()
      .then((response) =>
        setSettings({
          ...response.data,
          working_hours: normalizeWorkingHours(response.data.working_hours),
        }),
      )
      .catch((error) => setMessage({ type: 'error', text: error.message }))
      .finally(() => setLoading(false));
  }, []);

  const update = (updater: (current: SettingsData) => SettingsData) => {
    setSettings((current) => (current ? updater(current) : current));
  };

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    setMessage(null);
    try {
      const payload = {
        ...settings,
        working_hours: normalizeWorkingHours(settings.working_hours),
      };
      const response = await api.updateSettings(payload);
      setSettings({
        ...response.data,
        working_hours: normalizeWorkingHours(response.data.working_hours),
      });
      setMessage({ type: 'success', text: 'Ayarlar kaydedildi.' });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Kaydetme başarısız.' });
    } finally {
      setSaving(false);
    }
  };

  const pickImage = (field: 'logo' | 'header_bg') => {
    const frame = openMediaFrame();
    if (!frame) return;
    frame.on('select', () => {
      const attachment = frame.state().get('selection').first().toJSON();
      update((current) => ({
        ...current,
        restaurant_info: {
          ...current.restaurant_info,
          ...(field === 'logo'
            ? { logo_url: attachment.url, logo_id: attachment.id }
            : { header_bg_url: attachment.url, header_bg_id: attachment.id }),
        },
      }));
    });
    frame.open();
  };

  if (loading || !settings) {
    return (
      <div className="hb-admin">
        <div className="hb-loading">
          <span className="hb-spinner" />
          Ayarlar yükleniyor...
        </div>
      </div>
    );
  }

  const menuSlug = (settings.slug?.slug || 'qrmenu').replace(/^\/+|\/+$/g, '');
  const menuUrl = `${(settings.home_url || '').replace(/\/$/, '')}/${menuSlug}/`;

  return (
    <div className="hb-admin">
      <PageHeader
        title="Ayarlar"
        description="Restoran bilgileri, menü adresi ve görünüm ayarlarını yönetin."
      />

      {message && (
        <Alert type={message.type} onDismiss={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      <Tabs tabs={[...TABS]} active={tab} onChange={(id) => setTab(id as TabId)} />

      {tab === 'general' && (
        <>
          <SectionCard title="Restoran Bilgileri" description="QR menüde görünecek temel bilgiler.">
            <FormField label="Restoran Adı">
              <input
                className="hb-input"
                value={String(settings.restaurant_info.title || '')}
                onChange={(e) =>
                  update((c) => ({ ...c, restaurant_info: { ...c.restaurant_info, title: e.target.value } }))
                }
              />
            </FormField>
            <FormField label="Slogan">
              <input
                className="hb-input"
                value={String(settings.restaurant_info.slogan || '')}
                onChange={(e) =>
                  update((c) => ({ ...c, restaurant_info: { ...c.restaurant_info, slogan: e.target.value } }))
                }
              />
            </FormField>
            <FormField label="Logo">
              <div className="hb-input-group">
                <input className="hb-input" value={String(settings.restaurant_info.logo_url || '')} readOnly />
                <button type="button" className="button" onClick={() => pickImage('logo')}>
                  Seç
                </button>
              </div>
            </FormField>
            <FormField label="Header Arka Plan">
              <div className="hb-input-group">
                <input className="hb-input" value={String(settings.restaurant_info.header_bg_url || '')} readOnly />
                <button type="button" className="button" onClick={() => pickImage('header_bg')}>
                  Seç
                </button>
              </div>
            </FormField>
          </SectionCard>

          <SectionCard title="Menü Adresi" description="QR kodun yönlendireceği URL.">
            <FormField label="URL Slug" hint={`Menü adresi: ${menuUrl}`}>
              <input
                className="hb-input"
                value={settings.slug?.slug || 'qrmenu'}
                onChange={(e) => update((c) => ({ ...c, slug: { slug: e.target.value } }))}
              />
            </FormField>
            <MenuQrCode url={menuUrl} />
          </SectionCard>
        </>
      )}

      {tab === 'languages' && (
        <SectionCard title="Dil Ayarları" description="Menüde desteklenecek dilleri seçin.">
          <FormField label="Aktif Diller">
            <div className="hb-check-grid">
              {Object.entries(LANGUAGES).map(([code, label]) => (
                <CheckboxCard
                  key={code}
                  label={label}
                  description={code}
                  checked={settings.languages.includes(code)}
                  onChange={(checked) =>
                    update((c) => ({
                      ...c,
                      languages: checked
                        ? [...c.languages, code]
                        : c.languages.filter((l) => l !== code),
                    }))
                  }
                />
              ))}
            </div>
          </FormField>
          <div className="hb-field-row">
            <FormField label="Varsayılan Dil">
              <select
                className="hb-input"
                value={settings.default_language}
                onChange={(e) => update((c) => ({ ...c, default_language: e.target.value }))}
              >
                {settings.languages.map((code) => (
                  <option key={code} value={code}>
                    {LANGUAGES[code] || code}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Para Birimi">
              <input
                className="hb-input"
                value={settings.default_currency}
                onChange={(e) => update((c) => ({ ...c, default_currency: e.target.value }))}
              />
            </FormField>
          </div>
        </SectionCard>
      )}

      {tab === 'hours' && (
        <SectionCard title="Çalışma Saatleri" description="Her gün için açık/kapalı ve saat aralığı belirleyin.">
          <div className="hb-hours-list">
            {DAYS.map((day) => {
              const row = settings.working_hours[day] || {
                is_open: 0,
                open_time: '09:00',
                close_time: '18:00',
              };
              const isOpen = Number(row.is_open) === 1;
              return (
                <div key={day} className={`hb-hours-row${isOpen ? '' : ' is-closed'}`}>
                  <Toggle
                    label={DAY_LABELS[day]}
                    checked={isOpen}
                    onChange={(checked) =>
                      update((c) => ({
                        ...c,
                        working_hours: {
                          ...c.working_hours,
                          [day]: {
                            ...c.working_hours[day],
                            is_open: checked ? 1 : 0,
                            open_time: c.working_hours[day]?.open_time || '09:00',
                            close_time: c.working_hours[day]?.close_time || '18:00',
                          },
                        },
                      }))
                    }
                  />
                  <div className="hb-hours-times">
                    <input
                      className="hb-input"
                      type="time"
                      value={row.open_time || '09:00'}
                      disabled={!isOpen}
                      onChange={(e) =>
                        update((c) => ({
                          ...c,
                          working_hours: {
                            ...c.working_hours,
                            [day]: { ...c.working_hours[day], open_time: e.target.value },
                          },
                        }))
                      }
                    />
                    <span className="hb-hours-sep">—</span>
                    <input
                      className="hb-input"
                      type="time"
                      value={row.close_time || '18:00'}
                      disabled={!isOpen}
                      onChange={(e) =>
                        update((c) => ({
                          ...c,
                          working_hours: {
                            ...c.working_hours,
                            [day]: { ...c.working_hours[day], close_time: e.target.value },
                          },
                        }))
                      }
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      )}

      {tab === 'appearance' && (
        <ThemeAppearanceSection settings={settings} onChange={update} />
      )}

      {tab === 'social' && (
        <>
          <SectionCard title="Sosyal Medya" description="Menüde görünecek sosyal medya linkleri.">
            <div className="hb-field-row">
              {SOCIAL_KEYS.map(({ key, label }) => (
                <FormField key={key} label={label}>
                  <input
                    className="hb-input"
                    type="url"
                    placeholder={`https://${key}.com/...`}
                    value={settings.social_media[key] || ''}
                    onChange={(e) =>
                      update((c) => ({
                        ...c,
                        social_media: { ...c.social_media, [key]: e.target.value },
                      }))
                    }
                  />
                </FormField>
              ))}
            </div>
          </SectionCard>
          <SectionCard title="WiFi Bilgileri" description="Müşterileriniz menüden WiFi bilgisine ulaşabilir.">
            <div className="hb-field-row">
              <FormField label="SSID">
                <input
                  className="hb-input"
                  value={settings.wifi.ssid || ''}
                  onChange={(e) => update((c) => ({ ...c, wifi: { ...c.wifi, ssid: e.target.value } }))}
                />
              </FormField>
              <FormField label="Şifre">
                <input
                  className="hb-input"
                  value={settings.wifi.password || ''}
                  onChange={(e) => update((c) => ({ ...c, wifi: { ...c.wifi, password: e.target.value } }))}
                />
              </FormField>
            </div>
          </SectionCard>
        </>
      )}

      {tab === 'advanced' && (
        <SectionCard title="Ek Bilgi" description="Menüde gösterilecek HTML içerik.">
          <FormField label="HTML İçerik" hint="WordPress görsel editörü ile biçimlendirebilirsiniz.">
            <WordPressHtmlEditor
              value={settings.information.html_info || ''}
              onChange={(html) => update((c) => ({ ...c, information: { html_info: html } }))}
            />
          </FormField>
        </SectionCard>
      )}

      {tab === 'security' && (
        <>
          <SectionCard
            title="Google reCAPTCHA v3"
            description="Yorum formunda spam koruması. Site Key ve Secret Key ikisi de dolu olduğunda formda otomatik etkinleşir."
          >
            <div className="hb-field-row">
              <FormField label="Site Key" hint="reCAPTCHA yönetim panelinden alınan site anahtarı.">
                <input
                  className="hb-input"
                  value={settings.recaptcha?.site_key || ''}
                  onChange={(e) =>
                    update((c) => ({
                      ...c,
                      recaptcha: { ...c.recaptcha, site_key: e.target.value },
                    }))
                  }
                  placeholder="6Lc..."
                  autoComplete="off"
                />
              </FormField>
              <FormField
                label="Secret Key"
                hint={
                  settings.recaptcha?.has_secret_key
                    ? 'Gizli anahtar kayıtlı. Değiştirmek için yeni değer girin.'
                    : 'reCAPTCHA yönetim panelinden alınan gizli anahtar.'
                }
              >
                <input
                  className="hb-input"
                  type="password"
                  value={settings.recaptcha?.secret_key || ''}
                  onChange={(e) =>
                    update((c) => ({
                      ...c,
                      recaptcha: { ...c.recaptcha, secret_key: e.target.value },
                    }))
                  }
                  placeholder={settings.recaptcha?.has_secret_key ? '••••••••••••' : '6Lc...'}
                  autoComplete="new-password"
                />
              </FormField>
            </div>
            {settings.recaptcha?.site_key && settings.recaptcha?.has_secret_key && (
              <p className="hb-muted" style={{ marginTop: 12 }}>
                reCAPTCHA aktif — yorum formunda görünmez doğrulama çalışıyor.
              </p>
            )}
          </SectionCard>

          <SectionCard
            title="Gizlilik"
            description="Yorum formunda ve menüde gösterilecek gizlilik politikası bağlantısı."
          >
            <FormField
              label="Gizlilik Politikası URL"
              hint="Boş bırakılırsa varsayılan HappyBites gizlilik politikası kullanılır."
            >
              <input
                className="hb-input"
                type="url"
                value={String(settings.restaurant_info.privacy_policy_url || '')}
                onChange={(e) =>
                  update((c) => ({
                    ...c,
                    restaurant_info: { ...c.restaurant_info, privacy_policy_url: e.target.value },
                  }))
                }
                placeholder="https://ornekrestoran.com/gizlilik-politikasi"
              />
            </FormField>
            <p className="hb-muted" style={{ margin: '12px 0 0' }}>
              Varsayılan:{' '}
              <a href="https://happybites.io/privacy-policy" target="_blank" rel="noreferrer">
                happybites.io/privacy-policy
              </a>
            </p>
          </SectionCard>
        </>
      )}

      {tab === 'mcp' && <McpSettingsSection />}

      {tab !== 'mcp' && (
        <div className="hb-save-bar">
          <span className="hb-save-bar__hint">Değişiklikler kaydedilene kadar menüde görünmez.</span>
          <button type="button" className="button button-primary" onClick={save} disabled={saving}>
            {saving ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
          </button>
        </div>
      )}
    </div>
  );
}
