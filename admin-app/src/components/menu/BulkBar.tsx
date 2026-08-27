import { t } from '../../i18n';

interface Props {
  count: number;
  busy: boolean;
  onMove: () => void;
  onPublish: () => void;
  onDraft: () => void;
  onDelete: () => void;
  onClear: () => void;
}

export function BulkBar({ count, busy, onMove, onPublish, onDraft, onDelete, onClear }: Props) {
  return (
    <div className="hb-bulk-bar" role="toolbar" aria-label={t('menu.bulkActions')}>
      <span className="hb-bulk-bar__count">{t('menu.selectedCount', { count })}</span>
      <div className="hb-bulk-bar__actions">
        <button type="button" className="button" disabled={busy} onClick={onMove}>
          ⤷ {t('menu.bulkMove')}
        </button>
        <button type="button" className="button" disabled={busy} onClick={onPublish}>
          {t('menu.bulkPublish')}
        </button>
        <button type="button" className="button" disabled={busy} onClick={onDraft}>
          {t('menu.bulkDraft')}
        </button>
        <button type="button" className="button hb-btn-danger" disabled={busy} onClick={onDelete}>
          {t('menu.bulkDelete')}
        </button>
      </div>
      <button type="button" className="button hb-bulk-bar__clear" disabled={busy} onClick={onClear}>
        {t('menu.clearSelection')}
      </button>
    </div>
  );
}
