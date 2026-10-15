import { Check } from 'lucide-react';
import { MIN_STRENGTH, passwordRules, passwordStrength } from '../../lib/password';
import { ui } from '../../styles/ui';

export default function PasswordStrength({ value }) {
  const strength = passwordStrength(value);
  return (
    <div>
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-full ${
              i < strength ? (strength < MIN_STRENGTH ? 'bg-amber-500' : 'bg-teal-600 dark:bg-teal-400') : 'bg-gray-200 dark:bg-gray-800'
            }`}
          />
        ))}
      </div>
      <ul className="mt-2 grid grid-cols-2 gap-1 text-xs">
        {passwordRules(value).map(([label, ok]) => (
          <li key={label} className={`flex items-center gap-1.5 ${ok ? 'text-teal-700 dark:text-teal-300' : ui.muted}`}>
            {ok ? <Check size={12} /> : <span className="h-3 w-3 rounded-full border border-current" />} {label}
          </li>
        ))}
      </ul>
    </div>
  );
}
