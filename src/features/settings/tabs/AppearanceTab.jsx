import { Monitor, Moon, Sun } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { useApp } from '../../../context/AppContext';
import { ui } from '../../../styles/ui';

const THEMES = [
  ['light', 'Light', Sun],
  ['dark', 'Dark', Moon],
  ['system', 'Match device', Monitor],
];

export default function AppearanceTab() {
  const { themePref, setThemePref } = useApp();
  return (
    <Card title="Theme">
      <div className="grid gap-3 p-4 sm:grid-cols-3 sm:p-5">
        {THEMES.map(([value, label, Icon]) => (
          <button
            type="button"
            key={value}
            onClick={() => setThemePref(value)}
            className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-medium ${
              themePref === value
                ? 'border-teal-600 bg-teal-50 text-teal-800 dark:border-teal-400 dark:bg-teal-500/10 dark:text-teal-300'
                : `border-gray-200 dark:border-gray-700 ${ui.body} ${ui.hover}`
            }`}
          >
            <Icon size={22} /> {label}
          </button>
        ))}
      </div>
    </Card>
  );
}
