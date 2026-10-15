import { useState } from 'react';
import { KeyRound, LifeBuoy, LogOut, Moon, Settings, Sun, UserRound } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ROLE_LABELS } from '../../config/roles';
import { canVisitPage } from '../../config/navigation';
import { initials } from '../../lib/format';
import { ui } from '../../styles/ui';
import Dropdown from '../ui/Dropdown';

export default function AccountMenu() {
  const { user, role, dark, toggleTheme, go, signOut, access, rolePermissions } = useApp();
  const [open, setOpen] = useState(false);

  const item = (label, Icon, onClick, danger) => (
    <button
      type="button"
      onClick={() => {
        setOpen(false);
        onClick();
      }}
      className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm ${
        danger ? 'text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10' : `${ui.body} ${ui.hover}`
      }`}
    >
      <Icon size={16} /> {label}
    </button>
  );

  return (
    <Dropdown
      open={open}
      setOpen={setOpen}
      width="w-64"
      button={
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="ml-1 flex items-center gap-2.5 rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Account menu"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-900 text-xs font-semibold text-white dark:bg-gray-100 dark:text-gray-900">
            {initials(user.name)}
          </span>
          <span className="hidden text-left leading-tight xl:block">
            <span className={`block text-sm font-medium ${ui.h}`}>{user.name}</span>
            <span className={`block text-xs ${ui.muted}`}>{ROLE_LABELS[role]}</span>
          </span>
        </button>
      }
    >
      <div className={`mb-1 border-b px-2.5 pb-2.5 pt-1.5 ${ui.line}`}>
        <p className={`truncate text-sm font-medium ${ui.h}`}>{user.name}</p>
        <p className={`truncate text-xs ${ui.muted}`}>{user.email}</p>
      </div>
      {canVisitPage('profile', access, rolePermissions, role) && item('Profile', UserRound, () => go('profile'))}
      {canVisitPage('password', access, rolePermissions, role) && item('Reset password', KeyRound, () => go('password'))}
      {canVisitPage('settings', access, rolePermissions, role) && item('Settings', Settings, () => go('settings'))}
      {item(dark ? 'Light mode' : 'Dark mode', dark ? Sun : Moon, toggleTheme)}
      {rolePermissions['settings.support']?.canView && item('Help & support', LifeBuoy, () => go('settings', 'support'))}
      <div className={`my-1 border-t ${ui.line}`} />
      {item('Sign out', LogOut, signOut, true)}
    </Dropdown>
  );
}
