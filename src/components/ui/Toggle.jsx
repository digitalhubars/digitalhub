import { ui } from '../../styles/ui';

export default function Toggle({ checked, onChange, label, hint, disabled }) {
  return (
    <label className={`flex items-start justify-between gap-4 py-3 ${disabled ? 'opacity-60' : 'cursor-pointer'}`}>
      <span>
        <span className={`block text-sm font-medium ${ui.h}`}>{label}</span>
        {hint && <span className={`mt-0.5 block text-xs ${ui.muted}`}>{hint}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 rounded-full transition ${checked ? 'bg-teal-700 dark:bg-teal-500' : 'bg-gray-300 dark:bg-gray-700'}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${checked ? 'left-[22px]' : 'left-0.5'}`} />
      </button>
    </label>
  );
}
