import { Badge, StoreBadge } from '../../components/ui/Badge';
import { PLATFORM_NAMES, PLATFORMS } from '../../data/platforms';
import { ui } from '../../styles/ui';

// Labels a store by its marketplace account ID, or its URL for key-based stores.
export const storeAddress = (store) => (store.accountId ? `${PLATFORMS[store.platform].account} ${store.accountId}` : store.url);

/**
 * Checklist of stores grouped by platform, with "Select all" per platform.
 * `othersOf(storeId)` optionally lists other clients that already share the store.
 */
export default function StorePicker({ stores, picked, onChange, othersOf }) {
  const groups = PLATFORM_NAMES.map((name) => [name, stores.filter((s) => s.platform === name)]).filter(([, list]) => list.length);
  const toggle = (id) => onChange(picked.includes(id) ? picked.filter((x) => x !== id) : [...picked, id]);

  if (!groups.length) return <p className={`py-8 text-center text-sm ${ui.muted}`}>No stores match.</p>;

  return (
    <div className="space-y-4">
      {groups.map(([platform, list]) => {
        const selected = list.filter((s) => picked.includes(s.id)).length;
        const all = selected === list.length;
        return (
          <section key={platform} className="rounded-lg border border-gray-200 dark:border-gray-800">
            <header className={`flex items-center justify-between gap-2 border-b px-3 py-2 ${ui.line}`}>
              <span className="flex items-center gap-2">
                <StoreBadge store={{ platform, name: '' }} showStore={false} />
                <span className={`text-xs ${ui.muted}`}>
                  {selected} of {list.length} selected
                </span>
              </span>
              <button
                type="button"
                onClick={() =>
                  onChange(all ? picked.filter((id) => !list.some((s) => s.id === id)) : [...new Set([...picked, ...list.map((s) => s.id)])])
                }
                className="text-xs font-medium text-teal-700 hover:underline dark:text-teal-300"
              >
                {all ? 'Clear' : 'Select all'}
              </button>
            </header>
            <ul className={ui.divide}>
              {list.map((store) => {
                const on = picked.includes(store.id);
                const others = othersOf ? othersOf(store.id) : [];
                return (
                  <li key={store.id}>
                    <label className={`flex cursor-pointer items-start gap-3 px-3 py-2.5 ${on ? 'bg-teal-50/60 dark:bg-teal-500/10' : ui.hover}`}>
                      <input type="checkbox" checked={on} onChange={() => toggle(store.id)} className="mt-0.5 h-4 w-4 shrink-0 accent-teal-700" />
                      <span className="min-w-0 flex-1">
                        <span className={`block truncate text-sm font-medium ${ui.h}`}>{store.name}</span>
                        <span className={`block truncate text-xs ${ui.muted}`}>{storeAddress(store)}</span>
                        {others.length > 0 && (
                          <span className={`mt-0.5 block truncate text-xs ${ui.muted}`}>Also shared with {others.map((c) => c.company).join(', ')}</span>
                        )}
                      </span>
                      {(store.status === 'paused' || store.health !== 'connected') && (
                        <Badge status={store.status === 'paused' ? 'paused' : store.health} />
                      )}
                    </label>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
