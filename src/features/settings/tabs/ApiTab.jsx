import { Card } from '../../../components/ui/Card';
import Callout from '../../../components/ui/Callout';
import Field from '../../../components/ui/Field';
import { useApp } from '../../../context/AppContext';
import { ui } from '../../../styles/ui';
import CopyField from '../CopyField';

const project = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'your-project';
const webhookUrl = (storeId) => `https://asia-southeast1-${project}.cloudfunctions.net/wooWebhook?store=${storeId}`;

// WooCommerce webhooks are created automatically when a store first syncs.
export default function ApiTab() {
  const { stores } = useApp();
  const live = stores.filter((s) => s.platform === 'WooCommerce' && !s.sample);

  return (
    <Card title="WooCommerce webhooks">
      <div className="space-y-4 p-4 sm:p-5">
        <p className={`text-sm ${ui.muted}`}>
          When a store syncs for the first time, Digital Hub adds webhooks in that store for product, order and customer changes. Each request is signed
          with a secret only the server knows. You can see them in WooCommerce → Settings → Advanced → Webhooks.
        </p>
        {live.length === 0 && <Callout tone="info">No WooCommerce stores yet.</Callout>}
        {live.map((s) => (
          <Field
            key={s.id}
            label={s.name}
            hint={s.webhooks === 'active' ? 'Webhooks are set up.' : s.webhooks === 'local' ? 'Running locally: webhooks are added after deploying.' : 'Not set up yet. Sync the store once.'}
          >
            <CopyField value={webhookUrl(s.id)} />
          </Field>
        ))}
      </div>
    </Card>
  );
}
