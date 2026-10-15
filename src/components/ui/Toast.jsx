import { CircleCheck, RefreshCw, TriangleAlert, X } from 'lucide-react';
import { ui } from '../../styles/ui';

// toast: { title, body?, tone?: 'danger', pending?: boolean, payload?: object }
export default function Toast({ toast, onClose }) {
  if (!toast) return null;
  const Icon = toast.pending ? RefreshCw : toast.tone === 'danger' ? TriangleAlert : CircleCheck;
  const iconClass = toast.pending
    ? `animate-spin ${ui.muted}`
    : toast.tone === 'danger'
      ? 'text-red-600 dark:text-red-400'
      : 'text-teal-700 dark:text-teal-300';

  return (
    <div className="fixed inset-x-3 bottom-3 z-[60] rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900 sm:inset-x-auto sm:bottom-5 sm:right-5 sm:w-[380px]">
      <div className="flex items-start gap-3 px-4 py-3.5">
        <Icon size={18} className={`mt-0.5 shrink-0 ${iconClass}`} />
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-medium ${ui.h}`}>{toast.title}</p>
          {toast.body && <p className={`mt-0.5 text-xs ${ui.muted}`}>{toast.body}</p>}
        </div>
        <button type="button" onClick={onClose} className="rounded p-0.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200" aria-label="Dismiss">
          <X size={15} />
        </button>
      </div>
      {toast.payload && (
        <pre className="mx-4 mb-4 max-h-44 overflow-auto rounded-lg bg-gray-900 p-3 text-[11px] leading-relaxed text-gray-100 dark:bg-black">
          {JSON.stringify(toast.payload, null, 2)}
        </pre>
      )}
    </div>
  );
}
