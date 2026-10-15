import { ShoppingCart } from 'lucide-react';
import { Card, StatCard } from '../../components/ui/Card';
import LinkButton from '../../components/ui/LinkButton';
import PageHeader from '../../components/ui/PageHeader';
import { useApp } from '../../context/AppContext';
import { LowStockStat, OrdersStat, RecentOrdersCard, SalesChartCard, SalesStat } from './DashboardParts';
import RecentActivityCard from './RecentActivityCard';
import StoreHealthList from './StoreHealthList';
import useDashboardData from './useDashboardData';

// Every store, every platform, plus integration health and the activity log.
export default function AdminDashboard() {
  const { money, go } = useApp();
  const data = useDashboardData();

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader title="All stores" description="Every connected Shopify, WooCommerce, Amazon, eBay and TikTok Shop store." />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <SalesStat data={data} />
        <OrdersStat data={data} />
        <StatCard label="Average order" value={money(data.averageOrder)} hint={`${data.visibleStores.length} stores`} icon={ShoppingCart} />
        <LowStockStat data={data} />
      </div>

      <div className="grid gap-4 sm:gap-6 xl:grid-cols-3">
        <SalesChartCard data={data} />
        <Card title="Integrations" action={<LinkButton onClick={() => go('integrations')}>Manage</LinkButton>}>
          <StoreHealthList stores={data.visibleStores} />
        </Card>
      </div>

      <div className="grid gap-4 sm:gap-6 xl:grid-cols-3">
        <RecentOrdersCard data={data} />
        <RecentActivityCard />
      </div>
    </div>
  );
}
