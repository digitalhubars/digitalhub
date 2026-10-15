import { RefreshCw } from 'lucide-react';
import { Badge, StoreBadge } from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { useApp } from '../../../context/AppContext';
import { formatLastSync } from '../../../lib/format';
import { ui } from '../../../styles/ui';

const RULES = [
  ['Edits in Digital Hub', 'Sent to WooCommerce within seconds. The row shows “Syncing” until the store confirms, or the reason if it refuses.'],
  ['Edits in WooCommerce', 'Arrive through webhooks within seconds, on every open screen.'],
  ['Missed changes', 'A check runs every 15 minutes and fills any gap, for example while a webhook was failing.'],
  ['Both sides changed', 'An edit made here is kept until it has been sent; after that, the newest change wins.'],
  ['Paused stores', 'Edits wait and go out when you resume the store.'],
];

export default function SyncTab() {
  const { stores, resyncStore, syncingStores } = useApp();
  const live = stores.filter((s) => s.platform === 'WooCommerce' && !s.sample);

  return (
    <div className="space-y-4">
      <Card title="How syncing works">
        <dl className={ui.divide}>
          {RULES.map(([title, text]) => (
            <div key={title} className="px-4 py-3 sm:px-5">
              <dt className={`text-sm font-medium ${ui.h}`}>{title}</dt>
              <dd className={`mt-0.5 text-sm ${ui.muted}`}>{text}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card
        title="Live stores"
        action={
          live.length > 0 && (
            <Button size="sm" onClick={() => live.filter((s) => s.status === 'active').forEach((s) => resyncStore(s, { quiet: true }))}>
              <RefreshCw size={12} /> Sync all now
            </Button>
          )
        }
      >
        {live.length === 0 && (
          <p className={`px-5 py-8 text-center text-sm ${ui.muted}`}>No WooCommerce stores yet. Add one on the Integrations page.</p>
        )}
        <ul className={ui.divide}>
          {live.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5">
              <div className="min-w-0 flex-1">
                <p className={`truncate text-sm font-medium ${ui.h}`}>{s.name}</p>
                <p className={`text-xs ${ui.muted}`}>
                  Last sync {formatLastSync(s.lastSync)}
                  {s.counts ? ` · ${s.counts.products} products, ${s.counts.orders} orders` : ''}
                </p>
                {s.lastError && <p className="mt-0.5 text-xs text-red-700 dark:text-red-400">{s.lastError}</p>}
              </div>
              <StoreBadge store={s} showStore={false} />
              <Badge status={s.status === 'paused' ? 'paused' : syncingStores[s.id] ? 'checking' : s.health} />
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
