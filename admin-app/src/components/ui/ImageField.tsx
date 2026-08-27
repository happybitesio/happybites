import { t } from '../../i18n';
import { openMediaFrame } from '../../utils/media';

interface Props {
  value?: string;
  onChange: (imageId: number, imageUrl: string) => void;
  onClear: () => void;
  emptyLabel?: string;
  hint?: string;
  variant?: 'default' | 'inline' | 'banner';
  previewOnly?: boolean;
}

export function ImageField({
  value,
  onChange,
  onClear,
  emptyLabel = t('imageField.empty'),
  hint,
  variant = 'default',
  previewOnly = false,
}: Props) {
  const pickImage = () => {
    const frame = openMediaFrame();
    if (!frame) {
      window.alert(t('imageField.mediaError'));
      return;
    }

    frame.on('select', () => {
      const attachment = frame.state().get('selection').first().toJSON();
      onChange(attachment.id, attachment.url);
    });
    frame.open();
  };

  return (
    <div
      className={`hb-image-field${
        variant === 'inline'
          ? ' hb-image-field--inline'
          : variant === 'banner'
            ? ' hb-image-field--banner'
            : ''
      }`}
    >
      <button
        type="button"
        className={`hb-image-field__preview${
          variant === 'inline' ? ' hb-image-field__preview--sm' : variant === 'banner' ? ' hb-image-field__preview--banner' : ''
        }`}
        onClick={pickImage}
      >
        {value ? (
          <img src={value} alt="" className="hb-image-field__img" />
        ) : (
          <span className="hb-image-field__empty">
            <span className="hb-image-field__icon">{variant === 'inline' ? '📷' : '📷'}</span>
            {variant !== 'inline' && <span>{emptyLabel}</span>}
          </span>
        )}
      </button>
      {!previewOnly && (
      <div className="hb-image-field__side">
        <div className="hb-image-field__actions">
          <button type="button" className="button button-small" onClick={pickImage}>
            {value ? t('imageField.change') : t('imageField.select')}
          </button>
          {value && (
            <button type="button" className="button button-small hb-btn-ghost hb-btn-danger" onClick={onClear}>
              {t('imageField.remove')}
            </button>
          )}
        </div>
        {hint && <p className="hb-image-field__hint">{hint}</p>}
      </div>
      )}
    </div>
  );
}
