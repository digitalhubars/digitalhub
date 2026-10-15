import { X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { canVisitPage, NAV_ITEMS } from '../../config/navigation';
import { ui } from '../../styles/ui';
import Select from '../ui/Select';
import Logo from './Logo';

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin dashboard' },
  { value: 'manager', label: 'Manager dashboard' },
  { value: 'staff', label: 'Staff dashboard' },
];

function SidebarContent({ onNavigate }) {
  const { page, go, access, role, rolePermissions, setRole, isAdmin, team, clients, viewAs, setViewAs, settings } = useApp();
  const items = NAV_ITEMS.filter((item) => canVisitPage(item.key, access, rolePermissions, role));
  const managers = team.filter((m) => m.role === 'manager');

  return (
    <div className="flex h-full flex-col">
      <div className={`flex h-14 shrink-0 items-center border-b px-5 ${ui.line}`}>
        <Logo name={settings.workspaceName} />
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {items.map(({ key, label, icon: Icon }) => {
          const active = page === key;
          return (
            <button
              type="button"
              key={key}
              onClick={() => {
                go(key);
                onNavigate?.();
              }}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                active
                  ? 'bg-teal-50 text-teal-800 dark:bg-teal-500/10 dark:text-teal-300'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100'
              }`}
            >
              <Icon size={17} className={active ? 'text-teal-700 dark:text-teal-300' : 'text-gray-400 dark:text-gray-500'} />
              {label}
            </button>
          );
        })}
      </nav>

      {/* Admins only: switch between the available dashboards. */}
      {isAdmin && (
      <div className={`space-y-2 border-t p-3 ${ui.line}`}>
        <p className={`px-1 text-xs font-medium ${ui.muted}`}>Switch dashboard</p>
        <Select
          value={role}
          onChange={(r) => {
            setRole(r);
            onNavigate?.();
          }}
          options={ROLE_OPTIONS}
        />
        {role === 'manager' && (
          <Select
            value={viewAs.manager || managers[0]?.id || ''}
            onChange={(id) => setViewAs((v) => ({ ...v, manager: id }))}
            options={managers.length ? managers.map((m) => ({ value: m.id, label: m.name })) : [{ value: '', label: 'No managers yet' }]}
          />
        )}
        {role === 'staff' && (
          <Select
            value={viewAs.client || clients[0]?.id || ''}
            onChange={(id) => setViewAs((v) => ({ ...v, client: id }))}
            options={clients.length ? clients.map((c) => ({ value: c.id, label: `${c.company}${c.status !== 'active' ? ` (${c.status})` : ''}` })) : [{ value: '', label: 'No clients yet' }]}
          />
        )}
      </div>
      )}
    </div>
  );
}

// Fixed column on lg+, slide-over drawer below that.
export default function Sidebar({ mobileOpen, setMobileOpen }) {
  return (
    <>
      <aside className="hidden w-60 shrink-0 border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 lg:block">
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" onMouseDown={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-gray-950/50" />
          <aside onMouseDown={(e) => e.stopPropagation()} className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-xl dark:bg-gray-900">
            <button type="button" onClick={() => setMobileOpen(false)} className={`absolute right-3 top-3.5 ${ui.icon}`} aria-label="Close menu">
              <X size={18} />
            </button>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}
    </>
  );
}
