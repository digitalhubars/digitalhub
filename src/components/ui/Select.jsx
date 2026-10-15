import { ui } from '../../styles/ui';

// options: [{ value, label }]; onChange receives the value, not the event.
export default function Select({ value, onChange, options, className = '' }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={`${ui.input} ${className}`}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
