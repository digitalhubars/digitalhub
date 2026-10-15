import { X } from 'lucide-react';
import useEscapeKey from '../../hooks/useEscapeKey';
import { ui } from '../../styles/ui';

const SIZES = { sm: 'sm:max-w-sm', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl' };

// Bottom sheet on phones, centered dialog from `sm` up.
export default function Modal({ title, subtitle, onClose, children, footer, size = 'md' }) {
  useEscapeKey(onClose);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-gray-950/50 sm:items-center sm:p-4" onMouseDown={onClose}>
      <div
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        className={`flex max-h-[92dvh] w-full flex-col rounded-t-2xl bg-white shadow-xl dark:bg-gray-900 sm:rounded-2xl ${SIZES[size]}`}
      >
        <div className={`flex items-start justify-between gap-3 border-b px-5 py-4 sm:px-6 ${ui.line}`}>
          <div className="min-w-0">
            <h3 className={`text-base font-semibold [overflow-wrap:anywhere] ${ui.h}`}>{title}</h3>
            {subtitle && <div className="mt-1.5">{subtitle}</div>}
          </div>
          <button type="button" onClick={onClose} className={ui.icon} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {footer && <div className={`flex flex-wrap justify-end gap-2 border-t px-5 py-4 sm:px-6 ${ui.line}`}>{footer}</div>}
      </div>
    </div>
  );
}
