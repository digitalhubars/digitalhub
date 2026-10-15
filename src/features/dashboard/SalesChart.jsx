import { useApp } from '../../context/AppContext';
import { DAY, NOW } from '../../data/constants';
import { ui } from '../../styles/ui';

// 14 daily bars ending on the fixed "today"; today's bar is solid, hover shows the total.
export default function SalesChart({ orders }) {
  const { money } = useApp();

  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(NOW - (13 - i) * DAY);
    d.setHours(0, 0, 0, 0);
    const start = d.getTime();
    const total = orders.filter((o) => o.placedAt >= start && o.placedAt < start + DAY).reduce((sum, o) => sum + o.total, 0);
    return { start, total };
  });
  const max = Math.max(1, ...days.map((d) => d.total));

  return (
    <div className="px-4 pb-4 pt-5 sm:px-5">
      <div className="flex h-44 items-end gap-1 sm:h-60 sm:gap-2 xl:h-72">
        {days.map((day, i) => (
          <div key={day.start} className="group relative flex h-full flex-1 flex-col justify-end">
            <div
              className={`w-full rounded-t ${
                i === days.length - 1
                  ? 'bg-teal-700 dark:bg-teal-400'
                  : 'bg-teal-600/70 group-hover:bg-teal-700 dark:bg-teal-500/50 dark:group-hover:bg-teal-400'
              }`}
              style={{ height: `${Math.max(2, (day.total / max) * 100)}%` }}
            />
            <div className="pointer-events-none absolute -top-8 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-[11px] text-white group-hover:block dark:bg-gray-100 dark:text-gray-900">
              {new Date(day.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}: {money(day.total)}
            </div>
          </div>
        ))}
      </div>
      <div className={`mt-2 flex gap-1 text-[10px] sm:gap-2 sm:text-[11px] ${ui.muted}`}>
        {days.map((day, i) => (
          <span key={day.start} className="flex-1 text-center">
            {i % 2 === 1 || i === 13 ? new Date(day.start).getDate() : ''}
          </span>
        ))}
      </div>
    </div>
  );
}
