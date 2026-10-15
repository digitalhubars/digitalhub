import { Boxes } from 'lucide-react';
import { ui } from '../../styles/ui';

export default function Logo({ name }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-700 text-white dark:bg-teal-500 dark:text-gray-950">
        <Boxes size={16} />
      </span>
      <span className={`truncate text-[15px] font-semibold ${ui.h}`}>{name}</span>
    </div>
  );
}
