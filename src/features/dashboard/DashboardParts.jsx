import { DollarSign, Receipt, TriangleAlert } from 'lucide-react';
import { Card, StatCard } from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import LinkButton from '../../components/ui/LinkButton';
import { useApp } from '../../context/AppContext';
import { ui } from '../../styles/ui';
import { orderColumns } from '../orders/orderColumns';
import SalesChart from './SalesChart';

// Pieces every dashboard uses.

export function SalesStat({ data }) {
  const { money } = useApp();
  return (
    <StatCard
      label="Sales, 14 days"
      value={money(data.sales)}
      hint={`${data.weekChange >= 0 ? '+' : ''}${data.weekChange}% vs previous week`}
      icon={DollarSign}
    />
  );
}

export function OrdersStat({ data }) {
  return <StatCard label="Orders" value={data.counted.length} hint={`${data.waitingToShip} waiting to ship`} icon={Receipt} />;
}

export function LowStockStat({ data }) {
  const { settings } = useApp();
  return (
    <StatCard
      label="Low stock"
      value={data.lowStock.length}
      hint={`Under ${settings.lowStockThreshold} units`}
      icon={TriangleAlert}
      tone={data.lowStock.length ? 'warning' : undefined}
    />
  );
}

export function SalesChartCard({ data }) {
  return (
    <Card title="Daily sales" className="xl:col-span-2" action={<span className={`text-xs ${ui.muted}`}>Last 14 days</span>}>
      <SalesChart orders={data.counted} />
    </Card>
  );
}

export function RecentOrdersCard({ data }) {
  const { storeOf, customerOf, money, go, openDrawer } = useApp();
  return (
    <Card title="Recent orders" className="xl:col-span-2" action={<LinkButton onClick={() => go('orders')}>All orders</LinkButton>}>
      <DataTable
        columns={orderColumns(storeOf, customerOf, money)}
        rows={data.visibleOrders.slice(0, 6)}
        empty="No orders yet."
        onRowClick={(o) => openDrawer('order', o.id)}
      />
    </Card>
  );
}
