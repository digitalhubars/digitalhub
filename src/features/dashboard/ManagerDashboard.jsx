import { ShoppingCart } from 'lucide-react';
import { Card, StatCard } from '../../components/ui/Card';
import PageHeader from '../../components/ui/PageHeader';
import { useApp } from '../../context/AppContext';
import { LowStockStat, OrdersStat, RecentOrdersCard, SalesChartCard, SalesStat } from './DashboardParts';
import LowStockCard from './LowStockCard';
import StoreHealthList from './StoreHealthList';
import useDashboardData from './useDashboardData';

// Only the stores in the manager's group (narrowed further by the filter bar above).
export default function ManagerDashboard() {
  const { money, groups, user } = useApp();
  const data = useDashboardData();
  const groupName = groups.find((g) => g.id === user.groupId)?.name || 'Your';

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader title={`${groupName} group`} description="Stores assigned to you. Use the filter to focus on a few." />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <SalesStat data={data} />
        <OrdersStat data={data} />
        <StatCard label="Average order" value={money(data.averageOrder)} hint={`${data.visibleStores.length} stores`} icon={ShoppingCart} />
        <LowStockStat data={data} />
      </div>

      <div className="grid gap-4 sm:gap-6 xl:grid-cols-3">
        <SalesChartCard data={data} />
        <Card title="Store connections">
          <StoreHealthList stores={data.visibleStores} />
        </Card>
      </div>

      <div className="grid gap-4 sm:gap-6 xl:grid-cols-3">
        <RecentOrdersCard data={data} />
        <LowStockCard products={data.lowStock} />
      </div>
    </div>
  );
}
