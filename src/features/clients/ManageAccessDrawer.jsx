import { useState } from 'react';
import { PlatformDot } from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Drawer from '../../components/ui/Drawer';
import SearchInput from '../../components/ui/SearchInput';
import { useApp } from '../../context/AppContext';
import { PLATFORM_NAMES } from '../../data/platforms';
import { ui } from '../../styles/ui';
import StorePicker from './StorePicker';

// Slide-out panel: grant or revoke a client's access to stores on any platform.
export default function ManageAccessDrawer({ client, onClose, onEditDetails }) {
  const { stores, clients, saveClient } = useApp();
  const [picked, setPicked] = useState(client.storeIds);
  const [query, setQuery] = useState('');
  const [platform, setPlatform] = useState('all');

  const added = picked.filter((id) => !client.storeIds.includes(id));
  const removed = client.storeIds.filter((id) => !picked.includes(id));
  const platforms = PLATFORM_NAMES.filter((name) => stores.some((s) => s.platform === name));
  const ql = query.toLowerCase();
  const visible = stores.filter(
    (s) => (platform === 'all' || s.platform === platform) && (!ql || [s.name, s.url, s.accountId || ''].some((v) => v.toLowerCase().includes(ql))),
  );
  const othersOf = (storeId) => clients.filter((c) => c.id !== client.id && c.storeIds.includes(storeId));

  const save = () => {
    saveClient({ ...client, storeIds: picked }, false, { added: added.length, removed: removed.length });
    onClose();
  };

  return (
    <Drawer
      title="Manage store access"
      subtitle={
        <p className={`text-sm ${ui.muted}`}>
          {client.company} · {client.email}
        </p>
      }
      onClose={onClose}
      footer={
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
          <p className={`text-xs sm:mr-auto ${ui.muted}`}>
            {added.length || removed.length ? (
              <>
                {added.length > 0 && <span className="text-teal-700 dark:text-teal-300">+{added.length} granted</span>}
                {added.length > 0 && removed.length > 0 && ' · '}
                {removed.length > 0 && <span className="text-red-700 dark:text-red-400">−{removed.length} revoked</span>}
              </>
            ) : (
              `${picked.length} store${picked.length === 1 ? '' : 's'} assigned`
            )}
          </p>
          <div className="flex gap-2">
            <Button className="flex-1 sm:flex-none" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" className="flex-1 sm:flex-none" disabled={!added.length && !removed.length} onClick={save}>
              Save access
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <SearchInput value={query} onChange={setQuery} placeholder="Find a store, seller ID or URL" />
        <div className="flex flex-wrap gap-1.5">
          {['all', ...platforms].map((p) => (
            <button
              type="button"
              key={p}
              onClick={() => setPlatform(p)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
                platform === p
                  ? 'border-teal-600 bg-teal-50 text-teal-800 dark:border-teal-400 dark:bg-teal-500/10 dark:text-teal-300'
                  : `border-gray-300 dark:border-gray-700 ${ui.muted}`
              }`}
            >
              {p !== 'all' && <PlatformDot platform={p} />}
              {p === 'all' ? 'All platforms' : p}
            </button>
          ))}
        </div>
        <StorePicker stores={visible} picked={picked} onChange={setPicked} othersOf={othersOf} />
        <p className={`text-xs ${ui.muted}`}>
          The client sees products, orders and customers only from the stores checked here. What they can change is set in{' '}
          <button type="button" onClick={onEditDetails} className="font-medium text-teal-700 hover:underline dark:text-teal-300">
            permissions
          </button>
          .
        </p>
      </div>
    </Drawer>
  );
}
