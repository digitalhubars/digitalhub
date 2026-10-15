import { X } from 'lucide-react';
import useEscapeKey from '../../hooks/useEscapeKey';
import { ui } from '../../styles/ui';

// Right-side panel used for order and customer details.
export default function Drawer({ title, subtitle, onClose, children, footer }) {
  useEscapeKey(onClose);
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-gray-950/40" onMouseDown={onClose}>
      <aside onMouseDown={(e) => e.stopPropagation()} className="flex h-full w-full max-w-md flex-col bg-white shadow-xl dark:bg-gray-900">
        <div className={`flex items-start justify-between gap-3 border-b px-5 py-4 ${ui.line}`}>
          <div className="min-w-0">
            <h3 className={`text-base font-semibold [overflow-wrap:anywhere] ${ui.h}`}>{title}</h3>
            {subtitle && <div className="mt-1.5">{subtitle}</div>}
          </div>
          <button type="button" onClick={onClose} className={ui.icon} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer && <div className={`flex flex-wrap justify-end gap-2 border-t px-5 py-4 ${ui.line}`}>{footer}</div>}
      </aside>
    </div>
  );
}
