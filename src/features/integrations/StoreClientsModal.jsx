import { useState } from 'react';
import { Badge, StoreBadge } from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { useApp } from '../../context/AppContext';
import { ui } from '../../styles/ui';

// From a store's point of view: which clients can see it.
export default function StoreClientsModal({ store, onClose }) {
  const { clients, setStoreClients } = useApp();
  const [picked, setPicked] = useState(clients.filter((c) => c.storeIds.includes(store.id)).map((c) => c.id));
  const toggle = (id) => setPicked((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  return (
    <Modal
      title="Client access"
      subtitle={<StoreBadge store={store} />}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            onClick={() => {
              setStoreClients(store, picked);
              onClose();
            }}
          >
            Save
          </Button>
        </>
      }
    >
      <p className={`mb-3 text-sm ${ui.muted}`}>Checked clients can see this store’s products, orders and customers.</p>
      <ul className={`rounded-lg border border-gray-200 dark:border-gray-800 ${ui.divide}`}>
        {clients.map((c) => (
          <li key={c.id}>
            <label className={`flex cursor-pointer items-center gap-3 px-3 py-2.5 ${ui.hover}`}>
              <input type="checkbox" checked={picked.includes(c.id)} onChange={() => toggle(c.id)} className="h-4 w-4 accent-teal-700" />
              <span className="min-w-0 flex-1">
                <span className={`block truncate text-sm font-medium ${ui.h}`}>{c.company}</span>
                <span className={`block truncate text-xs ${ui.muted}`}>
                  {c.contact} · {c.storeIds.length} store{c.storeIds.length === 1 ? '' : 's'}
                </span>
              </span>
              {c.status !== 'active' && <Badge status={c.status} />}
            </label>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
