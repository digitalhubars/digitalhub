import { Clock, RefreshCw } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { useApp } from '../../context/AppContext';
import { timeAgo } from '../../lib/format';
import { ui } from '../../styles/ui';

// Connection status per store. `compact` hides the "Sync now" button (client view).
export default function StoreHealthList({ stores, compact }) {
  const { resyncStore, syncingStores } = useApp();

  if (!stores.length) return <p className={`px-5 py-8 text-center text-sm ${ui.muted}`}>No stores in view.</p>;

  return (
    <ul className={ui.divide}>
      {stores.map((store) => (
        <li key={store.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
          <div className="min-w-0 flex-1">
            <p className={`truncate text-sm font-medium ${ui.h}`}>{store.name}</p>
            <p className={`mt-0.5 flex items-center gap-1 text-xs ${ui.muted}`}>
              <Clock size={12} /> Last sync {timeAgo(store.lastSync)}
            </p>
          </div>
          <Badge status={store.status === 'paused' ? 'paused' : syncingStores[store.id] ? 'checking' : store.health} />
          {!compact && store.status !== 'paused' && (
            <button type="button" onClick={() => resyncStore(store)} className={ui.icon} title="Sync now">
              <RefreshCw size={15} className={syncingStores[store.id] ? 'animate-spin' : ''} />
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
