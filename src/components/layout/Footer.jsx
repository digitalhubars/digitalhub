import { LifeBuoy } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ui } from '../../styles/ui';

export default function Footer() {
  const { settings, go } = useApp();
  return (
    <footer
      className={`flex items-center justify-between gap-2 border-t border-gray-200 bg-white px-4 py-2.5 text-xs dark:border-gray-800 dark:bg-gray-900 sm:px-6 sm:py-3 ${ui.muted}`}
    >
      <span>
        © {new Date().getFullYear()} {settings.workspaceName}
      </span>
      <button type="button" onClick={() => go('settings', 'support')} className="inline-flex items-center gap-1 hover:text-gray-800 dark:hover:text-gray-200">
        <LifeBuoy size={13} /> Contact support
      </button>
    </footer>
  );
}
