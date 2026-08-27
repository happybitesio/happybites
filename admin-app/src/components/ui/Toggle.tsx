interface Props {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}

export function Toggle({ checked, label, onChange }: Props) {
  return (
    <label className="hb-toggle">
      <input
        type="checkbox"
        className="hb-toggle__input"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="hb-toggle__track" aria-hidden>
        <span className="hb-toggle__thumb" />
      </span>
      <span className="hb-toggle__label">{label}</span>
    </label>
  );
}
