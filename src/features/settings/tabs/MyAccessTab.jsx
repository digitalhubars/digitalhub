import { Check, X } from 'lucide-react';
import { Badge, StoreBadge } from '../../../components/ui/Badge';
import { Card } from '../../../components/ui/Card';
import { useApp } from '../../../context/AppContext';
import { ui } from '../../../styles/ui';

export default function MyAccessTab() {
  const { role, client, scopedStores, groups, user, access } = useApp();
  const abilities = [
    ['View dashboard and orders', true],
    ['View customers', access.viewCustomers],
    ['Edit products', access.editProducts],
    ['Add products', access.addProducts],
    ['Update order status', access.editOrders],
    ['Export data', access.exportData],
  ];

  return (
    <div className="space-y-4">
      <Card title="Stores you can access">
        <ul className={ui.divide}>
          {scopedStores.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm sm:px-5">
              <span className={ui.h}>{s.name}</span>
              <span className="flex items-center gap-2">
                <StoreBadge store={s} showStore={false} />
                {s.status === 'paused' && <Badge status="paused" />}
              </span>
            </li>
          ))}
        </ul>
        {role === 'manager' && (
          <p className={`border-t px-5 py-3 text-xs ${ui.line} ${ui.muted}`}>Store group: {groups.find((g) => g.id === user.groupId)?.name}</p>
        )}
      </Card>
      <Card title="What you can do">
        <ul className={ui.divide}>
          {abilities.map(([label, allowed]) => (
            <li key={label} className="flex items-center justify-between px-4 py-2.5 text-sm sm:px-5">
              <span className={ui.body}>{label}</span>
              {allowed ? <Check size={16} className="text-teal-700 dark:text-teal-300" /> : <X size={16} className="text-gray-400" />}
            </li>
          ))}
        </ul>
        {role === 'staff' && (
          <p className={`border-t px-5 py-3 text-xs ${ui.line} ${ui.muted}`}>Need more access? Contact your admin. Account: {client?.company}</p>
        )}
      </Card>
    </div>
  );
}
