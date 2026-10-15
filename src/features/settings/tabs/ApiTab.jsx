import { Card } from '../../../components/ui/Card';
import Callout from '../../../components/ui/Callout';
import Field from '../../../components/ui/Field';
import { useApp } from '../../../context/AppContext';
import { ui } from '../../../styles/ui';
import CopyField from '../CopyField';

export default function ApiTab() {
  const { stores } = useApp();
  const live = stores.filter((s) => s.platform === 'WooCommerce' && !s.sample);
  const siteOrigin = typeof window === 'undefined' ? '' : window.location.origin;
  const webhookUrl = (storeId) => `${siteOrigin}/.netlify/functions/woocommerce-webhook?storeId=${encodeURIComponent(storeId)}`;
  const storeEnvSuffix = (storeId) => String(storeId).toUpperCase().replace(/[^A-Z0-9]/g, '_');

  return (
    <Card title="WooCommerce webhooks">
      <div className="space-y-4 p-4 sm:p-5">
        <p className={`text-sm ${ui.muted}`}>
          Add these endpoints as WooCommerce webhooks for product, order, and customer create, update, and delete events. Set each webhook secret to the matching server-side Netlify variable. Sync also runs every 15 minutes as a backup.
        </p>
        {live.length === 0 && <Callout tone="info">No WooCommerce stores yet.</Callout>}
        {live.map((s) => (
          <Field
            key={s.id}
            label={s.name}
            hint={`Set the WooCommerce webhook secret to WC_STORE_${storeEnvSuffix(s.id)}_WEBHOOK_SECRET in Netlify.`}
          >
            <CopyField value={webhookUrl(s.id)} />
          </Field>
        ))}
      </div>
    </Card>
  );
}
