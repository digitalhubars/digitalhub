import { Mail } from 'lucide-react';
import { Badge, StoreBadge } from '../../components/ui/Badge';
import { StatCard } from '../../components/ui/Card';
import Drawer from '../../components/ui/Drawer';
import { useApp } from '../../context/AppContext';
import { formatDate } from '../../lib/format';
import { ui } from '../../styles/ui';

export default function CustomerDrawer({ customer, onClose }) {
  const { storeOf, orders, money, openDrawer } = useApp();
  const theirOrders = orders.filter((o) => o.customerId === customer.id);

  return (
    <Drawer title={customer.name} subtitle={<StoreBadge store={storeOf(customer.storeId)} />} onClose={onClose}>
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Orders" value={customer.orderCount} />
        <StatCard label="Total spent" value={money(customer.spent)} />
      </div>
      <p className={`mt-4 flex items-center gap-2 break-all text-sm ${ui.body}`}>
        <Mail size={15} className="shrink-0" /> {customer.email}
      </p>

      <h4 className={`mb-2 mt-6 text-xs font-medium uppercase tracking-wide ${ui.muted}`}>Orders</h4>
      <ul className={`rounded-lg border border-gray-200 dark:border-gray-800 ${ui.divide}`}>
        {theirOrders.length === 0 && <li className={`px-3 py-4 text-sm ${ui.muted}`}>No orders yet.</li>}
        {theirOrders.map((o) => (
          <li key={o.id}>
            <button
              type="button"
              onClick={() => openDrawer('order', o.id)}
              className={`flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm ${ui.hover}`}
            >
              <span className={ui.h}>
                {o.number} <span className={`text-xs ${ui.muted}`}>· {formatDate(o.placedAt)}</span>
              </span>
              <span className="flex items-center gap-2">
                <Badge status={o.status} />
                <span className="tabular-nums">{money(o.total)}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </Drawer>
  );
}
