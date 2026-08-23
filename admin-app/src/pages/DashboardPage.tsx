import { getConfig } from '../api/client';
import { PageHeader } from '../components/ui/PageHeader';
import { SectionCard } from '../components/ui/SectionCard';

export function DashboardPage() {
  const config = getConfig();

  const links = [
    { icon: '📋', label: 'Menü Yönetimi', desc: 'Kategori ve ürün düzenle', href: `${config.adminUrl}admin.php?page=happybites-manage-menu` },
    { icon: '⚙️', label: 'Ayarlar', desc: 'Restoran ve görünüm', href: `${config.adminUrl}admin.php?page=happybites-settings` },
    { icon: '⭐', label: 'Yorumlar', desc: 'Müşteri değerlendirmeleri', href: `${config.adminUrl}admin.php?page=happybites-reviews` },
    { icon: '🍽️', label: 'Menü Öğeleri', desc: 'Detaylı ürün düzenleme', href: `${config.adminUrl}edit.php?post_type=happybites_menu_item` },
    { icon: '📁', label: 'Kategoriler', desc: 'Taxonomy yönetimi', href: `${config.adminUrl}edit-tags.php?taxonomy=happybites_menu_category&post_type=happybites_menu_item` },
  ];

  return (
    <div className="hb-admin">
      <PageHeader
        title="HappyBites"
        description={`Sürüm ${config.pluginVersion} — QR menü yönetim paneli`}
      />

      <SectionCard title="Hızlı Erişim" description="Sık kullanılan sayfalara git.">
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

      <SectionCard title="Destek">
        <p className="hb-muted" style={{ margin: '0 0 8px' }}>
          Sorun yaşarsanız bizimle iletişime geçin.
        </p>
        <p style={{ margin: 0 }}>
          <a href="mailto:wp-support@happybites.io">wp-support@happybites.io</a>
          {' · '}
          <a href="https://happybites.io" target="_blank" rel="noreferrer">
            happybites.io
          </a>
        </p>
      </SectionCard>
    </div>
  );
}
