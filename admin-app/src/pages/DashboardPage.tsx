import { getConfig } from '../api/client';
import { PageHeader } from '../components/ui/PageHeader';
import { SectionCard } from '../components/ui/SectionCard';
import { t } from '../i18n';

export function DashboardPage() {
  const config = getConfig();

  const links = [
    { icon: '📋', label: t('dashboard.menuLabel'), desc: t('dashboard.menuDesc'), href: `${config.adminUrl}admin.php?page=happybites-manage-menu` },
    { icon: '⚙️', label: t('dashboard.settingsLabel'), desc: t('dashboard.settingsDesc'), href: `${config.adminUrl}admin.php?page=happybites-settings` },
    { icon: '⭐', label: t('dashboard.reviewsLabel'), desc: t('dashboard.reviewsDesc'), href: `${config.adminUrl}admin.php?page=happybites-reviews` },
    { icon: '📸', label: t('dashboard.storiesLabel'), desc: t('dashboard.storiesDesc'), href: `${config.adminUrl}admin.php?page=happybites-stories` },
    { icon: '🍽️', label: t('dashboard.menuItemsLabel'), desc: t('dashboard.menuItemsDesc'), href: `${config.adminUrl}edit.php?post_type=happybites_menu_item` },
    { icon: '📁', label: t('dashboard.categoriesLabel'), desc: t('dashboard.categoriesDesc'), href: `${config.adminUrl}edit-tags.php?taxonomy=happybites_menu_category&post_type=happybites_menu_item` },
  ];

  return (
    <div className="hb-admin">
      <PageHeader
        title={t('dashboard.title')}
        description={t('dashboard.description', { version: config.pluginVersion })}
      />

      <SectionCard title={t('dashboard.quickAccessTitle')} description={t('dashboard.quickAccessDesc')}>
        <div className="hb-dash-grid">
          {links.map((link) => (
            <a key={link.label} href={link.href} className="hb-dash-link">
              <span className="hb-dash-link__icon">{link.icon}</span>
              <span className="hb-dash-link__label">{link.label}</span>
              <span className="hb-dash-link__desc">{link.desc}</span>
            </a>
          ))}
        </div>
      </SectionCard>

      <SectionCard title={t('dashboard.supportTitle')}>
        <p className="hb-muted" style={{ margin: '0 0 8px' }}>
          {t('dashboard.supportText')}
        </p>
        <p style={{ margin: 0 }}>
          <a href="mailto:wp-support@happybites.io">wp-support@happybites.io</a>
          {' · '}
          <a
            href="https://happybites.io/?utm_source=happybites-plugin&utm_medium=admin-dashboard&utm_campaign=support"
            target="_blank"
            rel="noreferrer"
          >
            happybites.io
          </a>
        </p>
      </SectionCard>
    </div>
  );
}
