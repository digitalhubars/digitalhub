import { Search } from 'lucide-react';
import { ui } from '../../styles/ui';

export default function SearchInput({ value, onChange, placeholder = 'Search', className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={`${ui.input} pl-9`} />
    </div>
  );
}
