import { ui } from '../../styles/ui';

export function Card({ title, action, children, className = '', bodyClass = '' }) {
  return (
    <section className={`${ui.card} ${className}`}>
      {(title || action) && (
        <div className={`flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3.5 sm:px-5 ${ui.line}`}>
          <h2 className={`text-sm font-semibold ${ui.h}`}>{title}</h2>
          {action}
        </div>
      )}
      <div className={bodyClass}>{children}</div>
    </section>
  );
}

export function StatCard({ label, value, hint, icon: Icon, tone }) {
  return (
    <div className={`${ui.card} p-4 sm:p-5`}>
      <div className="flex items-center justify-between gap-2">
        <p className={`text-sm font-medium ${ui.muted}`}>{label}</p>
        {Icon && (
          <span
            className={`rounded-lg p-2 ${
              tone === 'warning'
                ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'
                : 'bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
            }`}
          >
            <Icon size={16} />
          </span>
        )}
      </div>
      <p className={`mt-2 text-xl font-semibold tracking-tight tabular-nums sm:mt-3 sm:text-2xl ${ui.h}`}>{value}</p>
      {hint && <p className={`mt-1 text-xs ${ui.muted}`}>{hint}</p>}
    </div>
  );
}
