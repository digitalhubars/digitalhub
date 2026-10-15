import { useRef } from 'react';
import useClickOutside from '../../hooks/useClickOutside';

// Controlled popover anchored to the right of its trigger (header menus).
export default function Dropdown({ open, setOpen, button, children, width = 'w-72' }) {
  const ref = useRef(null);
  useClickOutside(ref, () => setOpen(false), open);
  return (
    <div className="relative" ref={ref}>
      {button}
      {open && (
        <div className={`absolute right-0 z-40 mt-2 max-w-[calc(100vw-1.5rem)] rounded-xl border border-gray-200 bg-white p-1.5 shadow-lg dark:border-gray-700 dark:bg-gray-900 ${width}`}>
          {children}
        </div>
      )}
    </div>
  );
}
