import { useState } from 'react';
import { ChevronRight, Menu, Moon, Search, Sun } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ACCOUNT_PAGE_LABELS, NAV_ITEMS, SETTINGS_TABS } from '../../config/navigation';
import { ROLE_LABELS } from '../../config/roles';
import { ui } from '../../styles/ui';
import SearchInput from '../ui/SearchInput';
import AccountMenu from './AccountMenu';
import NotificationsMenu from './NotificationsMenu';

const SEARCH_PLACEHOLDER = 'Search products, orders, customers';

function Breadcrumbs() {
  const { page, settingsTab, role, go } = useApp();
  const pageLabel = NAV_ITEMS.find((n) => n.key === page)?.label || ACCOUNT_PAGE_LABELS[page];
  const tabLabel = page === 'settings' ? SETTINGS_TABS.find((t) => t.key === settingsTab)?.label : null;

  return (
    <nav className={`flex min-w-0 items-center gap-1.5 text-sm ${ui.muted}`} aria-label="Breadcrumb">
      <span className="hidden sm:inline">{ROLE_LABELS[role]}</span>
      <ChevronRight size={14} className="hidden shrink-0 sm:block" />
      <button type="button" onClick={() => go(page)} className={`truncate font-medium ${ui.h}`}>
        {pageLabel}
      </button>
      {tabLabel && (
        <>
          <ChevronRight size={14} className="hidden shrink-0 sm:block" />
          <span className="hidden truncate sm:inline">{tabLabel}</span>
        </>
      )}
    </nav>
  );
}

export default function Header({ onMenu }) {
  const { search, setSearch, dark, toggleTheme } = useApp();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  return (
    <header className="shrink-0 border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="flex h-14 items-center gap-2 px-3 sm:gap-3 sm:px-6">
        <button type="button" onClick={onMenu} className={`${ui.icon} lg:hidden`} aria-label="Open menu">
          <Menu size={20} />
        </button>

        <Breadcrumbs />

        <SearchInput value={search} onChange={setSearch} placeholder={SEARCH_PLACEHOLDER} className="ml-auto hidden w-full max-w-xs md:block" />

        <div className="ml-auto flex items-center gap-0.5 md:ml-0 sm:gap-1">
          <button type="button" onClick={() => setMobileSearchOpen((o) => !o)} className={`${ui.icon} md:hidden`} aria-label="Search">
            <Search size={18} />
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            className={ui.icon}
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={dark ? 'Light mode' : 'Dark mode'}
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <NotificationsMenu />
          <AccountMenu />
        </div>
      </div>

      {mobileSearchOpen && (
        <div className="px-3 pb-3 md:hidden">
          <SearchInput value={search} onChange={setSearch} placeholder={SEARCH_PLACEHOLDER} />
        </div>
      )}
    </header>
  );
}
