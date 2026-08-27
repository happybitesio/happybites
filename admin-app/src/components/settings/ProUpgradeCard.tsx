import type { ProStatus } from '../../api/client';
import { t } from '../../i18n';

interface Props {
  pro: ProStatus;
  title?: string;
  description?: string;
}

export function ProUpgradeCard({
  pro,
  title = t('pro.title'),
  description = t('pro.description'),
}: Props) {
  if (pro.is_pro) {
    return null;
  }

  return (
    <div className="hb-pro-upgrade">
      <div className="hb-pro-upgrade__badge">{t('pro.badge')}</div>
      <h3 className="hb-pro-upgrade__title">{title}</h3>
      <p className="hb-pro-upgrade__desc">{description}</p>
      <ul className="hb-pro-upgrade__features">
        <li>{t('pro.featureDesign')}</li>
        <li>{t('pro.featureStories')}</li>
        <li>{t('pro.featureDock')}</li>
        <li>{t('pro.featureAnalytics')}</li>
        <li>{t('pro.featureTransfer')}</li>
        <li>{t('pro.featureMcp')}</li>
      </ul>
      <a
        href={pro.checkout_url}
        target="_blank"
        rel="noreferrer"
        className="button button-primary"
      >
        {t('pro.upgrade')}
      </a>
    </div>
  );
}
