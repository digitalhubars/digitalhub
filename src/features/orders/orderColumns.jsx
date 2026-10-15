import { Badge, StoreBadge } from '../../components/ui/Badge';
import { formatDateTime } from '../../lib/format';
import { ui } from '../../styles/ui';

// Shared by the dashboard's "Recent orders" and the Orders page (which adds `placed`).
export function orderColumns(storeOf, customerOf, money, withPlaced = false) {
  return [
    { key: 'number', label: 'Order', primary: true, render: (o) => <span className={`font-medium ${ui.h}`}>{o.number}</span> },
    ...(withPlaced ? [{ key: 'placed', label: 'Placed', render: (o) => formatDateTime(o.placedAt) }] : []),
    { key: 'customer', label: 'Customer', render: (o) => customerOf(o.customerId)?.name || '—' },
    { key: 'store', label: 'Store', render: (o) => <StoreBadge store={storeOf(o.storeId)} /> },
    { key: 'status', label: 'Status', render: (o) => <Badge status={o.status} /> },
    { key: 'total', label: 'Total', align: 'right', aside: true, render: (o) => money(o.total) },
  ];
}
