import PageHeader from '../../components/ui/PageHeader';
import { settingsTabsFor } from '../../config/navigation';
import { useApp } from '../../context/AppContext';
import { ui } from '../../styles/ui';
import ClientsPage from '../clients/ClientsPage';
import ActivityTab from './tabs/ActivityTab';
import ApiTab from './tabs/ApiTab';
import AppearanceTab from './tabs/AppearanceTab';
import GeneralTab from './tabs/GeneralTab';
import GroupsTab from './tabs/GroupsTab';
import MyAccessTab from './tabs/MyAccessTab';
import NotificationsTab from './tabs/NotificationsTab';
import SecurityTab from './tabs/SecurityTab';
import SupportTab from './tabs/SupportTab';
import SyncTab from './tabs/SyncTab';
import UsersTab from './tabs/UsersTab';

const TAB_CONTENT = {
  general: GeneralTab,
  users: UsersTab,
  clients: () => <ClientsPage embedded />,
  groups: GroupsTab,
  sync: SyncTab,
  api: ApiTab,
  access: MyAccessTab,
  notifications: NotificationsTab,
  appearance: AppearanceTab,
  security: SecurityTab,
  activity: ActivityTab,
  support: SupportTab,
};

export default function SettingsPage() {
  const { role, settingsTab, go, rolePermissions } = useApp();
  const tabs = settingsTabsFor(role, rolePermissions);
  const current = tabs.find((t) => t.key === settingsTab) || tabs[0];
  const Content = TAB_CONTENT[current.key];

  return (
    <div className="space-y-4">
      <PageHeader title="Settings" description={role === 'admin' ? 'Manage the workspace, people, stores and syncing.' : 'Your preferences and access.'} />
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-6">
        {/* Horizontal scroller on phones, vertical list from md up */}
        <nav className="-mx-3 flex gap-1 overflow-x-auto px-3 pb-1 md:sticky md:top-0 md:mx-0 md:w-56 md:shrink-0 md:flex-col md:overflow-visible md:px-0">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              type="button"
              key={key}
              onClick={() => go('settings', key)}
              className={`flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${
                current.key === key
                  ? 'bg-white text-teal-800 shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:text-teal-300 dark:ring-gray-800'
                  : `text-gray-600 dark:text-gray-400 ${ui.hover}`
              }`}
            >
              <Icon size={16} /> {label}
            </button>
          ))}
        </nav>
        <div className="min-w-0 flex-1">
          <Content />
        </div>
      </div>
    </div>
  );
}
