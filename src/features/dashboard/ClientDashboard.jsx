import { Eye, Info, Package } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import Callout from '../../components/ui/Callout';
import { Card, StatCard } from '../../components/ui/Card';
import PageHeader from '../../components/ui/PageHeader';
import { useApp } from '../../context/AppContext';
import { ui } from '../../styles/ui';
import { LowStockStat, OrdersStat, RecentOrdersCard, SalesChartCard, SalesStat } from './DashboardParts';
import LowStockCard from './LowStockCard';
import StoreHealthList from './StoreHealthList';
import useDashboardData from './useDashboardData';

// Only the client's own stores; no integration controls or activity log.
export default function ClientDashboard() {
  const { access, client, user, settings } = useApp();
  const data = useDashboardData();

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title={client.company}
        description={`Signed in as ${user.name}.`}
        actions={
          !access.editProducts && (
            <Badge tone="neutral">
              <Eye size={12} className="mr-1" /> View only
            </Badge>
          )
        }
      />

      {access.editProducts ? (
        <Callout icon={Info} tone="info">
          You can update products for your stores. Changes are sent to the store automatically.
        </Callout>
      ) : (
        <Callout>You have view-only access to {data.visibleStores.map((s) => s.name).join(', ') || 'your stores'}.</Callout>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <SalesStat data={data} />
        <OrdersStat data={data} />
        <StatCard
          label="Products"
          value={data.visibleProducts.length}
          hint={`${data.visibleProducts.filter((p) => p.status === 'active').length} active`}
          icon={Package}
        />
        <LowStockStat data={data} />
      </div>

      <div className="grid gap-4 sm:gap-6 xl:grid-cols-3">
        <SalesChartCard data={data} />
        <LowStockCard products={data.lowStock} />
      </div>

      <div className="grid gap-4 sm:gap-6 xl:grid-cols-3">
        <RecentOrdersCard data={data} />
        <Card title="Your stores">
          <StoreHealthList stores={data.visibleStores} compact />
          <p className={`border-t px-5 py-3 text-xs ${ui.line} ${ui.muted}`}>
            Managed by {settings.workspaceName}. Contact {settings.supportEmail} for changes.
          </p>
        </Card>
      </div>
    </div>
  );
}
