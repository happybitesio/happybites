interface Props {
  type: 'success' | 'error' | 'info';
  children: React.ReactNode;
  onDismiss?: () => void;
}

export function Alert({ type, children, onDismiss }: Props) {
  return (
    <div className={`hb-alert hb-alert--${type}`} role="status">
      <span className="hb-alert__text">{children}</span>
      {onDismiss && (
        <button type="button" className="hb-alert__close" onClick={onDismiss} aria-label="Dismiss">
          ×
        </button>
      )}
    </div>
  );
}
