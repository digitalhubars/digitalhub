import { Card } from '../../components/ui/Card';
import LinkButton from '../../components/ui/LinkButton';
import { useApp } from '../../context/AppContext';
import { ui } from '../../styles/ui';

export default function LowStockCard({ products }) {
  const { settings, storeOf, go } = useApp();
  return (
    <Card title="Low stock" action={<LinkButton onClick={() => go('products')}>View products</LinkButton>}>
      {products.length === 0 && (
        <p className={`px-5 py-8 text-center text-sm ${ui.muted}`}>Everything is above {settings.lowStockThreshold} units.</p>
      )}
      <ul className={ui.divide}>
        {products.slice(0, 5).map((p) => (
          <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm sm:px-5">
            <div className="min-w-0">
              <p className={`truncate ${ui.h}`}>{p.title}</p>
              <p className={`truncate text-xs ${ui.muted}`}>{storeOf(p.storeId)?.name}</p>
            </div>
            <span className={`shrink-0 font-medium tabular-nums ${p.stock === 0 ? 'text-red-700 dark:text-red-400' : 'text-amber-700 dark:text-amber-400'}`}>
              {p.stock} left
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
