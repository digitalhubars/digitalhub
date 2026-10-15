import { PLATFORMS } from '../../data/platforms';
import { STATUS, TONES } from '../../styles/ui';

// Pass a known `status` key, or `tone` + children for a custom label.
export function Badge({ status, tone, children }) {
  const [label, statusTone] = STATUS[status] || [children, tone || 'neutral'];
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium ${TONES[tone || statusTone]}`}>
      {children || label}
    </span>
  );
}

// Platform pill, optionally followed by the store name or with the API name instead.
export function StoreBadge({ store, showStore = true, api = false }) {
  if (!store) return null;
  const platform = PLATFORMS[store.platform] || PLATFORMS.Shopify;
  return (
    <span className={`inline-flex max-w-full items-center gap-1.5 whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-medium ${platform.tone}`}>
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${platform.dot}`} />
      {api ? platform.api : store.platform}
      {showStore && <span className="truncate font-normal opacity-80">· {store.name}</span>}
    </span>
  );
}

export function PlatformDot({ platform }) {
  return <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${PLATFORMS[platform]?.dot}`} title={platform} />;
}
