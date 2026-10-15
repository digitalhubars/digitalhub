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
  { key: 'settings', label: 'Settings', icon: Settings },
];

// Pages reached from the account menu rather than the sidebar.
export const ACCOUNT_PAGE_LABELS = { profile: 'Profile', password: 'Reset password' };

export const SETTINGS_TABS = [
  { key: 'general', label: 'General', icon: SlidersHorizontal, roles: ['admin'] },
  { key: 'users', label: 'Users & roles', icon: UserCog, roles: ['admin'] },
  { key: 'clients', label: 'Clients & access', icon: Building2, roles: ['admin'] },
  { key: 'groups', label: 'Store groups', icon: Layers, roles: ['admin'] },
  { key: 'sync', label: 'Syncing', icon: RefreshCw, roles: ['admin'] },
  { key: 'api', label: 'Webhooks', icon: Webhook, roles: ['admin'] },
  { key: 'access', label: 'My access', icon: Store, roles: ['manager', 'client'] },
  { key: 'notifications', label: 'Notifications', icon: BellRing, roles: ALL_ROLES },
  { key: 'appearance', label: 'Appearance', icon: Palette, roles: ALL_ROLES },
  { key: 'security', label: 'Security', icon: Shield, roles: ALL_ROLES },
  { key: 'activity', label: 'Activity log', icon: History, roles: ['admin'] },
  { key: 'support', label: 'Help & support', icon: LifeBuoy, roles: ALL_ROLES },
];

export const settingsTabsFor = (role) => SETTINGS_TABS.filter((tab) => tab.roles.includes(role));

export function canVisitPage(page, access) {
  if (page in ACCOUNT_PAGE_LABELS) return true;
  const item = NAV_ITEMS.find((n) => n.key === page);
  return !!(item && (!item.needs || access[item.needs]));
}

// ---- URLs ------------------------------------------------------------------
export const DASHBOARDS = ['admin', 'manager', 'client'];

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
