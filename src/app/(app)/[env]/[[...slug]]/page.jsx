import { DASHBOARDS, NAV_ITEMS, SETTINGS_TABS } from '../../../../config/navigation';

// Every dashboard URL is generated ahead of time for static hosting:
// /admin, /admin/products, /admin/settings/users, /manager/orders, …
export const dynamicParams = false;

export function generateStaticParams() {
  const pages = [...NAV_ITEMS.map((n) => n.key).filter((k) => k !== 'dashboard'), 'profile', 'password'];
  return DASHBOARDS.flatMap((env) => [
    { env, slug: [] },
    ...pages.map((page) => ({ env, slug: [page] })),
    ...SETTINGS_TABS.filter((t) => t.roles.includes(env)).map((t) => ({ env, slug: ['settings', t.key] })),
  ]);
}

// The page is drawn by the client app shell in the (app) layout, which also
// checks the signed-in user's role.
export default function DashboardPage() {
  return null;
}
