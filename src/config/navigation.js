import {
  BellRing,
  Building2,
  History,
  Layers,
  LayoutDashboard,
  LifeBuoy,
  Package,
  Palette,
  Plug,
  RefreshCw,
  Settings,
  Shield,
  ShoppingCart,
  SlidersHorizontal,
  UserCog,
  Store,
  Users,
  Webhook,
} from 'lucide-react';
import { ALL_ROLES } from './roles';

// Sidebar pages. `needs` is the access flag required to see the page.
export const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'products', label: 'Products', icon: Package },
  { key: 'orders', label: 'Orders', icon: ShoppingCart },
  { key: 'customers', label: 'Customers', icon: Users, needs: 'viewCustomers' },
  { key: 'clients', label: 'Clients', icon: Building2, needs: 'manageSystem' },
  { key: 'integrations', label: 'Integrations', icon: Plug, needs: 'manageSystem' },
  { key: 'role-access', label: 'Role access', icon: Shield, adminOnly: true },
  { key: 'settings', label: 'Settings', icon: Settings },
];

// Pages reached from the account menu rather than the sidebar.
export const ACCOUNT_PAGE_LABELS = { profile: 'Profile', password: 'Reset password' };

export const SETTINGS_TABS = [
  { key: 'general', label: 'General', icon: SlidersHorizontal, roles: ALL_ROLES },
  { key: 'users', label: 'Users & roles', icon: UserCog, roles: ALL_ROLES, adminOnly: true },
  { key: 'clients', label: 'Clients & access', icon: Building2, roles: ALL_ROLES },
  { key: 'groups', label: 'Store groups', icon: Layers, roles: ALL_ROLES },
  { key: 'sync', label: 'Syncing', icon: RefreshCw, roles: ALL_ROLES },
  { key: 'api', label: 'Webhooks', icon: Webhook, roles: ALL_ROLES },
  { key: 'access', label: 'My access', icon: Store, roles: ALL_ROLES },
  { key: 'notifications', label: 'Notifications', icon: BellRing, roles: ALL_ROLES },
  { key: 'appearance', label: 'Appearance', icon: Palette, roles: ALL_ROLES },
  { key: 'security', label: 'Security', icon: Shield, roles: ALL_ROLES },
  { key: 'activity', label: 'Activity log', icon: History, roles: ALL_ROLES },
  { key: 'support', label: 'Help & support', icon: LifeBuoy, roles: ALL_ROLES },
];

export const settingsTabsFor = (role, permissions) =>
  SETTINGS_TABS.filter((tab) => tab.roles.includes(role) && (!tab.adminOnly || role === 'admin') && permissions?.[`settings.${tab.key}`]?.canView === true);

export function canVisitPage(page, access, permissions, role) {
  if (page in ACCOUNT_PAGE_LABELS) return permissions?.[page]?.canView === true;
  if (page === 'settings') return settingsTabsFor(role, permissions).length > 0;
  const item = NAV_ITEMS.find((n) => n.key === page);
  if (!item || (item.adminOnly && role !== 'admin')) return false;
  return permissions?.[page]?.canView === true && (!item.needs || access[item.needs]);
}

// ---- URLs ------------------------------------------------------------------
export const DASHBOARDS = ALL_ROLES;

// /<dashboard>[/<page>[/<settings tab>]]  e.g. /manager/orders, /admin/settings/team
export function parseRoute(pathname, fallbackRole) {
  const [env, page, tab] = pathname.split('/').filter(Boolean);
  return {
    env: DASHBOARDS.includes(env) ? env : fallbackRole,
    page: page || 'dashboard',
    tab: tab || null,
  };
}

export const routePath = (env, page = 'dashboard', tab = null) =>
  page === 'dashboard' ? `/${env}` : `/${env}/${page}${tab ? `/${tab}` : ''}`;
