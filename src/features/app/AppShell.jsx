import { Eye, Mail } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import GlobalOverlays from '../../components/layout/GlobalOverlays';
import StoreFilterBar from '../../components/layout/StoreFilterBar';
import ThemeRoot from '../../components/layout/ThemeRoot';
import Button from '../../components/ui/Button';
import Callout from '../../components/ui/Callout';
import { ROLE_LABELS } from '../../config/roles';
import { useApp } from '../../context/AppContext';
import PasswordPage from '../account/PasswordPage';
import ProfilePage from '../account/ProfilePage';
import AccountBlocked from '../auth/AccountBlocked';
import ClientsPage from '../clients/ClientsPage';
import CustomersPage from '../customers/CustomersPage';
import AdminDashboard from '../dashboard/AdminDashboard';
import ClientDashboard from '../dashboard/ClientDashboard';
import ManagerDashboard from '../dashboard/ManagerDashboard';
import IntegrationsPage from '../integrations/IntegrationsPage';
import OrdersPage from '../orders/OrdersPage';
import ProductsPage from '../products/ProductsPage';
import SettingsPage from '../settings/SettingsPage';

// Each role has its own dashboard; the other pages filter by role internally.
const DASHBOARDS = { admin: AdminDashboard, manager: ManagerDashboard, client: ClientDashboard };

const PAGES = {
  products: ProductsPage,
  orders: OrdersPage,
  customers: CustomersPage,
  clients: ClientsPage,
  integrations: IntegrationsPage,
  settings: SettingsPage,
  profile: ProfilePage,
  password: PasswordPage,
};

// Pages where managers get the store filter bar above the content.
const MANAGER_FILTER_PAGES = ['dashboard', 'products', 'orders', 'customers'];

// Why this account can't see its dashboard yet, or null if it can.
function blockedReason({ profile, role, client, user, settings, isPreview }) {
  const contact = `Contact ${settings.supportEmail} or your admin.`;
  if (profile.status === 'suspended') return { title: 'Your account is suspended', body: contact };
  if (role === 'client') {
    if (!client) {
      return isPreview
        ? { title: 'No client selected', body: 'Create a client first.' }
        : {
            title: 'Your account isn’t linked to a client yet',
            body: `Your admin needs to connect you to your company’s stores. ${contact} Setting up this workspace as its owner? Open the confirmation email we sent you, then reload this page.`,
          };
    }
    if (client.status === 'suspended') return { title: 'This client account is suspended', body: contact };
  }
  if (role === 'manager' && !user.groupId) {
    return { title: 'No store group assigned yet', body: `Your admin needs to give you a store group to manage. ${contact}` };
  }
  return null;
}

function PageContent() {
  const app = useApp();
  const { role, realRole, client, user, page, setRole } = app;
  const isPreview = realRole === 'admin' && role !== 'admin';
  const blocked = blockedReason({ ...app, isPreview });
  const Page = page === 'dashboard' ? DASHBOARDS[role] : PAGES[page];

  return (
    <>
      {isPreview && (
        <Callout
          icon={Eye}
          tone="info"
          action={
            <Button size="sm" onClick={() => setRole('admin')}>
              Back to admin
            </Button>
          }
        >
          You&apos;re viewing the {ROLE_LABELS[role]} dashboard{role === 'client' && client ? ` for ${client.company}` : user.name ? ` as ${user.name}` : ''}.
        </Callout>
      )}
      {blocked ? (
        <AccountBlocked title={blocked.title} body={blocked.body} showSignOut={!isPreview} />
      ) : (
        <>
          {role === 'client' && client.status === 'invited' && (
            <Callout icon={Mail} tone="info">
              {client.contact} hasn’t accepted the invite yet. This is what they’ll see after signing in.
            </Callout>
          )}
          {role === 'manager' && MANAGER_FILTER_PAGES.includes(page) && <StoreFilterBar />}
          {Page && <Page />}
        </>
      )}
    </>
  );
}

export default function AppShell() {
  return (
    <ThemeRoot>
      <AppLayout>
        <PageContent />
      </AppLayout>
      <GlobalOverlays />
    </ThemeRoot>
  );
}
