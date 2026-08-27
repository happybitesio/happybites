import { useEffect, useState } from 'react';
import { api, type ProStatus, type SettingsData } from '../api/client';
import { ImageField } from '../components/ui/ImageField';
import { Alert } from '../components/ui/Alert';
import { CheckboxCard } from '../components/ui/CheckboxCard';
import { FormField } from '../components/ui/FormField';
import { PageHeader } from '../components/ui/PageHeader';
import { SectionCard } from '../components/ui/SectionCard';
import { Tabs } from '../components/ui/Tabs';
import { LanguagesIcon } from '../components/ui/LanguagesIcon';
import { ThemeAppearanceSection } from '../components/settings/ThemeAppearanceSection';
import { MenuQrCode } from '../components/settings/MenuQrCode';
import { Toggle } from '../components/ui/Toggle';
import { WordPressHtmlEditor } from '../components/ui/WordPressHtmlEditor';
import { normalizeWorkingHours, WORKING_DAYS } from '../utils/workingHours';
import { t, tday, tlanguage } from '../i18n';

const LANGUAGE_CODES = ['tr', 'en', 'de', 'fr', 'es', 'pt', 'it', 'ru', 'ar', 'zh', 'ja', 'ko', 'ro'] as const;

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

type TabId =
  | 'general'
  | 'languages'
  | 'hours'
  | 'appearance'
  | 'social'
  | 'advanced'
  | 'security';

function normalizeMenuDisplay(
  menuDisplay?: SettingsData['menu_display'],
  pro?: ProStatus,
): NonNullable<SettingsData['menu_display']> {
  const canStories = Boolean(pro?.is_pro || pro?.features?.stories);

  return {
    default_view_mode: menuDisplay?.default_view_mode || 'list',
    list_style: menuDisplay?.list_style || 'classic',
    category_nav_mode: menuDisplay?.category_nav_mode || 'tabs',
    menu_entry_mode: menuDisplay?.menu_entry_mode || 'direct',
    header_style: menuDisplay?.header_style === 'centered' ? 'centered' : 'classic',
    stories_enabled: canStories && menuDisplay?.stories_enabled === '1' ? '1' : '0',
  };
}

export function SettingsPage() {
  const TABS = [
    { id: 'general' as const, label: t('settings.tabs.general'), icon: '🏪' },
    { id: 'languages' as const, label: t('settings.tabs.languages'), icon: <LanguagesIcon /> },
    { id: 'hours' as const, label: t('settings.tabs.hours'), icon: '🕐' },
    { id: 'appearance' as const, label: t('settings.tabs.appearance'), icon: '🎨' },
    { id: 'social' as const, label: t('settings.tabs.social'), icon: '📱' },
    { id: 'advanced' as const, label: t('settings.tabs.advanced'), icon: '📝' },
    { id: 'security' as const, label: t('settings.tabs.security'), icon: '🛡️' },
  ];

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
          menu_display: normalizeMenuDisplay(response.data.menu_display, response.data.pro),
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
        menu_display: normalizeMenuDisplay(settings.menu_display, settings.pro),
      };
      const response = await api.updateSettings(payload);
      setSettings({
        ...response.data,
        working_hours: normalizeWorkingHours(response.data.working_hours),
        menu_display: normalizeMenuDisplay(response.data.menu_display, response.data.pro),
      });
      setMessage({ type: 'success', text: t('settings.saveSuccess') });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : t('settings.saveFailed') });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="hb-admin">
        <div className="hb-loading">
          <span className="hb-spinner" />
          {t('settings.loading')}
        </div>
      </div>
    );
  }

  const menuSlug = (settings.slug?.slug || 'qrmenu').replace(/^\/+|\/+$/g, '');
  const menuUrl = `${(settings.home_url || '').replace(/\/$/, '')}/${menuSlug}/`;

  return (
    <div className="hb-admin">
      <PageHeader title={t('settings.title')} description={t('settings.description')} />

      {message && (
        <Alert type={message.type} onDismiss={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      <Tabs tabs={TABS} active={tab} onChange={(id) => setTab(id as TabId)} />

      {tab === 'general' && (
        <>
          <SectionCard title={t('settings.general.restaurantTitle')} description={t('settings.general.restaurantDesc')}>
            <FormField label={t('settings.general.name')}>
              <input
                className="hb-input"
                value={String(settings.restaurant_info.title || '')}
                onChange={(e) =>
                  update((c) => ({ ...c, restaurant_info: { ...c.restaurant_info, title: e.target.value } }))
                }
              />
            </FormField>
            <FormField label={t('settings.general.slogan')}>
              <input
                className="hb-input"
                value={String(settings.restaurant_info.slogan || '')}
                onChange={(e) =>
                  update((c) => ({ ...c, restaurant_info: { ...c.restaurant_info, slogan: e.target.value } }))
                }
              />
            </FormField>
            <FormField label={t('settings.general.logo')}>
              <ImageField
                variant="inline"
                value={String(settings.restaurant_info.logo_url || '')}
                onChange={(imageId, imageUrl) =>
                  update((c) => ({
                    ...c,
                    restaurant_info: { ...c.restaurant_info, logo_url: imageUrl, logo_id: imageId },
                  }))
                }
                onClear={() =>
                  update((c) => ({
                    ...c,
                    restaurant_info: { ...c.restaurant_info, logo_url: '', logo_id: 0 },
                  }))
                }
              />
            </FormField>
            <FormField label={t('settings.general.headerBg')}>
              <ImageField
                variant="banner"
                value={String(settings.restaurant_info.header_bg_url || '')}
                onChange={(imageId, imageUrl) =>
                  update((c) => ({
                    ...c,
                    restaurant_info: { ...c.restaurant_info, header_bg_url: imageUrl, header_bg_id: imageId },
                  }))
                }
                onClear={() =>
                  update((c) => ({
                    ...c,
                    restaurant_info: { ...c.restaurant_info, header_bg_url: '', header_bg_id: 0 },
                  }))
                }
              />
            </FormField>
          </SectionCard>

          <SectionCard title={t('settings.general.menuUrlTitle')} description={t('settings.general.menuUrlDesc')}>
            <FormField label={t('settings.general.slug')} hint={t('settings.general.slugHint', { url: menuUrl })}>
              <input
                className="hb-input"
                value={settings.slug?.slug || 'qrmenu'}
                onChange={(e) => update((c) => ({ ...c, slug: { slug: e.target.value } }))}
              />
            </FormField>
            <MenuQrCode url={menuUrl} brandColor={String(settings.colors?.active_color || settings.colors?.light?.primary || '')} />
            <div className="hb-qr-block">
              <Toggle
                label={t('settings.general.creditLabel')}
                checked={settings.restaurant_info.show_credit === '1' || settings.restaurant_info.show_credit === 1}
                onChange={(checked) =>
                  update((c) => ({
                    ...c,
                    restaurant_info: { ...c.restaurant_info, show_credit: checked ? '1' : '0' },
                  }))
                }
              />
              <p className="hb-muted" style={{ margin: '8px 0 0' }}>
                {t('settings.general.creditHint')}
              </p>
            </div>
          </SectionCard>
        </>
      )}

      {tab === 'languages' && (
        <SectionCard title={t('settings.languages.title')} description={t('settings.languages.description')}>
          <FormField label={t('settings.languages.active')}>
            <div className="hb-check-grid">
              {LANGUAGE_CODES.map((code) => (
                <CheckboxCard
                  key={code}
                  label={tlanguage(code)}
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
            <FormField label={t('settings.languages.default')}>
              <select
                className="hb-input"
                value={settings.default_language}
                onChange={(e) => update((c) => ({ ...c, default_language: e.target.value }))}
              >
                {settings.languages.map((code) => (
                  <option key={code} value={code}>
                    {tlanguage(code)}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label={t('settings.languages.currency')}>
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
        <SectionCard title={t('settings.hours.title')} description={t('settings.hours.description')}>
          <div className="hb-hours-list">
            {WORKING_DAYS.map((day) => {
              const row = settings.working_hours[day] || {
                is_open: 0,
                open_time: '09:00',
                close_time: '18:00',
              };
              const isOpen = Number(row.is_open) === 1;
              return (
                <div key={day} className={`hb-hours-row${isOpen ? '' : ' is-closed'}`}>
                  <Toggle
                    label={tday(day)}
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
        <ThemeAppearanceSection settings={settings} onChange={update} pro={settings.pro} />
      )}

      {tab === 'social' && (
        <>
          <SectionCard title={t('settings.social.title')} description={t('settings.social.description')}>
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
          <SectionCard title={t('settings.social.wifiTitle')} description={t('settings.social.wifiDesc')}>
            <div className="hb-field-row">
              <FormField label={t('settings.social.ssid')}>
                <input
                  className="hb-input"
                  value={settings.wifi.ssid || ''}
                  onChange={(e) => update((c) => ({ ...c, wifi: { ...c.wifi, ssid: e.target.value } }))}
                />
              </FormField>
              <FormField label={t('settings.social.password')}>
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
        <SectionCard title={t('settings.advanced.title')} description={t('settings.advanced.description')}>
          <FormField label={t('settings.advanced.html')} hint={t('settings.advanced.htmlHint')}>
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
            title={t('settings.security.recaptchaTitle')}
            description={t('settings.security.recaptchaDesc')}
          >
            <div className="hb-field-row">
              <FormField label={t('settings.security.siteKey')} hint={t('settings.security.siteKeyHint')}>
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
                label={t('settings.security.secretKey')}
                hint={
                  settings.recaptcha?.has_secret_key
                    ? t('settings.security.secretKeyHintSaved')
                    : t('settings.security.secretKeyHintNew')
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
                {t('settings.security.recaptchaActive')}
              </p>
            )}
          </SectionCard>

          <SectionCard title={t('settings.security.privacyTitle')} description={t('settings.security.privacyDesc')}>
            <FormField label={t('settings.security.privacyUrl')} hint={t('settings.security.privacyHint')}>
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
                placeholder={t('settings.security.privacyPlaceholder')}
              />
            </FormField>
            <p className="hb-muted" style={{ margin: '12px 0 0' }}>
              {t('settings.security.privacyFallback')}
            </p>
          </SectionCard>
        </>
      )}

      <div className="hb-save-bar">
        <span className="hb-save-bar__hint">{t('settings.saveBarHint')}</span>
        <button type="button" className="button button-primary" onClick={save} disabled={saving}>
          {saving ? t('common.saving') : t('settings.saveBtn')}
        </button>
      </div>
    </div>
  );
}
