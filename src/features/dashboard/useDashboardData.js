import { useApp } from '../../context/AppContext';
import { DAY, NOW } from '../../data/constants';

const sumTotals = (list) => list.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

// Numbers for whichever stores the current role can see (`storeIds` is already scoped).
export default function useDashboardData() {
  const { storeIds, stores, orders, products, settings } = useApp();

  const visibleOrders = orders.filter((o) => storeIds.includes(o.storeId));
  const counted = visibleOrders.filter((o) => o.status !== 'refunded' && o.status !== 'cancelled');
  const thisWeek = sumTotals(counted.filter((o) => o.placedAt > NOW - 7 * DAY));
  const lastWeek = sumTotals(counted.filter((o) => o.placedAt <= NOW - 7 * DAY && o.placedAt > NOW - 14 * DAY));
  const visibleProducts = products.filter((p) => storeIds.includes(p.storeId));

  return {
    visibleOrders,
    counted,
    sales: sumTotals(counted),
    averageOrder: counted.length ? sumTotals(counted) / counted.length : 0,
    weekChange: lastWeek ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : 0,
    waitingToShip: visibleOrders.filter((o) => o.status === 'unfulfilled').length,
    visibleProducts,
    lowStock: visibleProducts.filter((p) => p.stock != null && p.stock < settings.lowStockThreshold).sort((a, b) => a.stock - b.stock),
    visibleStores: stores.filter((s) => storeIds.includes(s.id)),
  };
}
