import { Check, Filter } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ui } from '../../styles/ui';

// Manager-only chip bar for narrowing the dashboard and lists to a few stores.
export default function StoreFilterBar() {
  const { scopedStores, selectedStores, setSelectedStores } = useApp();
  const toggle = (id) => setSelectedStores((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  return (
    <div className={`${ui.card} flex flex-wrap items-center gap-2 px-4 py-3`}>
      <span className={`mr-1 inline-flex items-center gap-1.5 text-sm font-medium ${ui.body}`}>
        <Filter size={14} /> Managing {selectedStores.length} of {scopedStores.length} stores
      </span>
      {scopedStores.map((store) => {
        const on = selectedStores.includes(store.id);
        return (
          <button
            type="button"
            key={store.id}
            onClick={() => toggle(store.id)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition ${
              on
                ? 'border-teal-600 bg-teal-50 text-teal-800 dark:border-teal-400 dark:bg-teal-500/10 dark:text-teal-300'
                : 'border-gray-300 bg-white text-gray-500 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400'
            }`}
          >
            {on && <Check size={12} />} {store.name}
          </button>
        );
      })}
    </div>
  );
}
