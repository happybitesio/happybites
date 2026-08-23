interface Props {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, actions }: Props) {
  return (
    <header className="hb-page-header">
      <div className="hb-page-header__text">
        <h1>{title}</h1>
        {description && <p className="hb-page-header__desc">{description}</p>}
      </div>
      {actions && <div className="hb-page-header__actions">{actions}</div>}
    </header>
  );
}
