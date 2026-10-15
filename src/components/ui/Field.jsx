import { ui } from '../../styles/ui';

export default function Field({ label, error, hint, children, className = '' }) {
  return (
    <div className={className}>
      {label && <label className={ui.label}>{label}</label>}
      {children}
      {hint && !error && <p className={`mt-1 text-xs ${ui.muted}`}>{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-700 dark:text-red-400">{error}</p>}
    </div>
  );
}
