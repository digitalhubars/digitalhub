import { useState } from 'react';
import { Download } from 'lucide-react';
import Button from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import PageHeader from '../../components/ui/PageHeader';
import Select from '../../components/ui/Select';
import { useApp } from '../../context/AppContext';
import { PLATFORM_NAMES } from '../../data/platforms';
import { downloadCsv } from '../../lib/format';
import { ORDER_STATUSES, STATUS } from '../../styles/ui';
import { orderColumns } from './orderColumns';

export default function OrdersPage() {
  const { role, access, scopedStores, storeIds, storeOf, customerOf, orders, money, q, openDrawer } = useApp();
  const [storeFilter, setStoreFilter] = useState('all');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const platforms = PLATFORM_NAMES.filter((name) => scopedStores.some((s) => s.platform === name && storeIds.includes(s.id)));
  const rows = orders.filter(
    (o) =>
      storeIds.includes(o.storeId) &&
      (storeFilter === 'all' || o.storeId === storeFilter) &&
      (platformFilter === 'all' || storeOf(o.storeId)?.platform === platformFilter) &&
      (statusFilter === 'all' || o.status === statusFilter) &&
      (!q || [o.number, customerOf(o.customerId)?.name, storeOf(o.storeId)?.name].some((v) => String(v).toLowerCase().includes(q))),
  );

  const exportCsv = () =>
    downloadCsv(
      'orders.csv',
      rows.map((o) => ({
        order: o.number,
        placed: new Date(o.placedAt).toISOString(),
        customer: customerOf(o.customerId)?.name,
        store: storeOf(o.storeId)?.name,
        platform: storeOf(o.storeId)?.platform,
        status: o.status,
        total: o.total.toFixed(2),
      })),
    );

  return (
    <div className="space-y-4">
      <PageHeader
        title="Orders"
        description={role === 'client' ? 'Orders placed in your stores. Tap an order for details.' : 'Tap an order to see items and update its status.'}
        actions={
          access.exportData && (
            <Button onClick={exportCsv}>
              <Download size={15} /> Export
            </Button>
          )
        }
      />
      <Card
        title={`${rows.length} order${rows.length === 1 ? '' : 's'}`}
        action={
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
            {platforms.length > 1 && (
              <Select
                value={platformFilter}
                onChange={setPlatformFilter}
                className="sm:w-40"
                options={[{ value: 'all', label: 'All platforms' }, ...platforms.map((p) => ({ value: p, label: p }))]}
              />
            )}
            {storeIds.length > 1 && (
              <Select
                value={storeFilter}
                onChange={setStoreFilter}
                className="sm:w-44"
                options={[
                  { value: 'all', label: 'All stores' },
                  ...scopedStores.filter((s) => storeIds.includes(s.id)).map((s) => ({ value: s.id, label: s.name })),
                ]}
              />
            )}
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              className="sm:w-40"
              options={[{ value: 'all', label: 'Any status' }, ...ORDER_STATUSES.map((s) => ({ value: s, label: STATUS[s][0] }))]}
            />
          </div>
        }
      >
        <DataTable
          columns={orderColumns(storeOf, customerOf, money, true)}
          rows={rows}
          pageSize={10}
          onRowClick={(o) => openDrawer('order', o.id)}
          empty="No orders match these filters."
        />
      </Card>
    </div>
  );
}
