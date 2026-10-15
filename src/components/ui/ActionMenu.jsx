import { useRef, useState } from 'react';
import { Ellipsis } from 'lucide-react';
import useClickOutside from '../../hooks/useClickOutside';
import { ui } from '../../styles/ui';

// "…" row menu. items: [{ label, icon, onClick, danger, hidden }]
export default function ActionMenu({ items }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useClickOutside(ref, () => setOpen(false), open);

  const visible = items.filter((item) => !item.hidden);
  if (!visible.length) return null;

  return (
    <div className="relative inline-block text-left" ref={ref}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className={ui.icon}
        aria-label="Actions"
      >
        <Ellipsis size={16} />
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-1 w-48 rounded-lg border border-gray-200 bg-white p-1 shadow-lg dark:border-gray-700 dark:bg-gray-900">
          {visible.map(({ label, icon: Icon, onClick, danger }) => (
            <button
              type="button"
              key={label}
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                onClick();
              }}
              className={`flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm ${
                danger ? 'text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10' : `${ui.body} ${ui.hover}`
              }`}
            >
              {Icon && <Icon size={15} />} {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
