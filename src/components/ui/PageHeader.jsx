import { ui } from '../../styles/ui';

export default function PageHeader({ title, description, actions }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className={`text-lg font-semibold tracking-tight sm:text-xl ${ui.h}`}>{title}</h1>
        {description && <p className={`mt-0.5 text-sm ${ui.muted}`}>{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
