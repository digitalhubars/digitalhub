import { useState } from 'react';
import { Bell, CircleCheck, TriangleAlert } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { timeAgo } from '../../lib/format';
import { ui } from '../../styles/ui';
import Dropdown from '../ui/Dropdown';

export default function NotificationsMenu() {
  const { notifications, markAllRead, canEditPage } = useApp();
  const [open, setOpen] = useState(false);
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <Dropdown
      open={open}
      setOpen={setOpen}
      width="w-80"
      button={
        <button type="button" onClick={() => setOpen((o) => !o)} className={`relative ${ui.icon}`} aria-label="Notifications">
          <Bell size={18} />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white ring-2 ring-white dark:ring-gray-900">
              {unread}
            </span>
          )}
        </button>
      }
    >
      <div className="flex items-center justify-between px-2.5 py-1.5">
        <p className={`text-xs font-medium uppercase tracking-wide ${ui.muted}`}>Notifications</p>
        {unread > 0 && canEditPage('notifications') && (
          <button type="button" onClick={markAllRead} className="text-xs font-medium text-teal-700 hover:underline dark:text-teal-300">
            Mark all as read
          </button>
        )}
      </div>
      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 && <p className={`px-2.5 py-4 text-sm ${ui.muted}`}>You&apos;re all caught up.</p>}
        {notifications.map((n) => (
          <div key={n.id} className={`flex gap-2.5 rounded-lg px-2.5 py-2 text-sm ${ui.hover}`}>
            {n.tone === 'danger' || n.tone === 'warning' ? (
              <TriangleAlert
                size={15}
                className={`mt-0.5 shrink-0 ${n.tone === 'danger' ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}
              />
            ) : (
              <CircleCheck size={15} className="mt-0.5 shrink-0 text-teal-700 dark:text-teal-300" />
            )}
            <div className="min-w-0 flex-1">
              <p className={n.read ? ui.muted : ui.h}>{n.text}</p>
              <p className={`mt-0.5 text-xs ${ui.muted}`}>{timeAgo(n.at)}</p>
            </div>
            {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-teal-600" />}
          </div>
        ))}
      </div>
    </Dropdown>
  );
}
