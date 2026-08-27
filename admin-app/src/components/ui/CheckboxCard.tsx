interface Props {
  checked: boolean;
  label: string;
  icon?: string;
  description?: string;
  variant?: 'default' | 'chip';
  onChange: (checked: boolean) => void;
}

export function CheckboxCard({
  checked,
  label,
  icon,
  description,
  variant = 'default',
  onChange,
}: Props) {
  return (
    <label className={`hb-check-card${variant === 'chip' ? ' hb-check-card--chip' : ''}${checked ? ' is-checked' : ''}`}>
      <input
        type="checkbox"
        className="hb-check-card__input"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="hb-check-card__box" aria-hidden />
      <span className="hb-check-card__content">
        {icon && <span className="hb-check-card__icon" aria-hidden>{icon}</span>}
        <span className="hb-check-card__label">{label}</span>
        {description && <span className="hb-check-card__desc">{description}</span>}
      </span>
    </label>
  );
}
