import { useEffect, useState } from 'react';
import { Badge, StoreBadge } from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Callout from '../../components/ui/Callout';
import Drawer from '../../components/ui/Drawer';
import Select from '../../components/ui/Select';
import { useApp } from '../../context/AppContext';
import { formatDateTime } from '../../lib/format';
import { ORDER_STATUSES, STATUS, ui } from '../../styles/ui';

export default function OrderDrawer({ order, onClose }) {
  const { access, storeOf, customerOf, money, updateOrderStatus, openDrawer } = useApp();
  const [status, setStatus] = useState(order.status);
  useEffect(() => setStatus(order.status), [order.status]);

  const store = storeOf(order.storeId);
  const customer = customerOf(order.customerId);

  return (
    <Drawer
      title={`Order ${order.number}`}
      subtitle={
        <div className="flex flex-wrap gap-2">
          <StoreBadge store={store} />
          <Badge status={order.status} />
        </div>
      }
      onClose={onClose}
      footer={
        access.editOrders && (
          <div className="flex w-full flex-col gap-2 sm:flex-row">
            <Select
              value={status}
              onChange={setStatus}
              className="sm:flex-1"
              options={ORDER_STATUSES.map((s) => ({ value: s, label: STATUS[s][0] }))}
            />
            <Button variant="primary" disabled={status === order.status} onClick={() => updateOrderStatus(order, status)}>
              Update and sync
            </Button>
          </div>
        )
      }
    >
      <dl className="grid grid-cols-2 gap-4 text-sm">
        <div className="col-span-2">
          <dt className={ui.muted}>{store?.platform} order number</dt>
          <dd className={`mt-0.5 break-all font-mono text-xs ${ui.h}`}>{order.number}</dd>
        </div>
        <div>
          <dt className={ui.muted}>Placed</dt>
          <dd className={`mt-0.5 ${ui.h}`}>{formatDateTime(order.placedAt)}</dd>
        </div>
        <div>
          <dt className={ui.muted}>Customer</dt>
          <dd className="mt-0.5">
            {customer ? (
              <button
                type="button"
                onClick={() => openDrawer('customer', customer.id)}
                className="text-left font-medium text-teal-700 hover:underline dark:text-teal-300"
              >
                {customer.name}
              </button>
            ) : (
              '—'
            )}
          </dd>
        </div>
        <div className="col-span-2">
          <dt className={ui.muted}>Email</dt>
          <dd className={`mt-0.5 break-all ${ui.h}`}>{customer?.email}</dd>
        </div>
      </dl>

      <h4 className={`mb-2 mt-6 text-xs font-medium uppercase tracking-wide ${ui.muted}`}>Items</h4>
      <ul className={`rounded-lg border border-gray-200 dark:border-gray-800 ${ui.divide}`}>
        {order.items.map((item, i) => (
          <li key={i} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
            <span className={`min-w-0 truncate ${ui.body}`}>
              {item.title} <span className={ui.muted}>× {item.qty}</span>
            </span>
            <span className={`shrink-0 tabular-nums ${ui.h}`}>{money(item.qty * item.price)}</span>
          </li>
        ))}
      </ul>

      <dl className={`mt-4 space-y-1.5 text-sm ${ui.body}`}>
        <div className="flex justify-between">
          <dt>Subtotal</dt>
          <dd className="tabular-nums">{money(order.subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Shipping</dt>
          <dd className="tabular-nums">{order.shipping ? money(order.shipping) : 'Free'}</dd>
        </div>
        <div className={`flex justify-between border-t pt-2 font-semibold ${ui.line} ${ui.h}`}>
          <dt>Total</dt>
          <dd className="tabular-nums">{money(order.total)}</dd>
        </div>
      </dl>

      {!access.editOrders && (
        <div className="mt-6">
          <Callout>Order status is managed by your account team.</Callout>
        </div>
      )}
    </Drawer>
  );
}
