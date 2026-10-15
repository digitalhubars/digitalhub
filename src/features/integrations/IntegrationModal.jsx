import { useState } from 'react';
import { CircleCheck, KeyRound, RefreshCw, Shield, TriangleAlert, Zap } from 'lucide-react';
import { StoreBadge } from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Callout from '../../components/ui/Callout';
import Field from '../../components/ui/Field';
import Modal from '../../components/ui/Modal';
import Select from '../../components/ui/Select';
import { useApp } from '../../context/AppContext';
import { isOAuthPlatform, PLATFORM_NAMES, PLATFORMS } from '../../data/platforms';
import { ui } from '../../styles/ui';

const MARKET_GROUP = 'g_market';

export default function IntegrationModal({ store, onClose }) {
  const { groups, clients, saveStore, testConnection } = useApp();
  const isNew = !store.id;
  const [form, setForm] = useState({
    platform: store.platform || 'Shopify',
    name: store.name || '',
    url: store.url || '',
    groupId: store.groupId || groups[0]?.id || '',
    syncFrequency: store.syncFrequency || 'default',
    status: store.status || 'active',
    region: store.region || '',
    clientId: '',
  });
  const [errors, setErrors] = useState({});
  const [test, setTest] = useState(null);

  const platform = PLATFORMS[form.platform];
  const usesOAuth = platform.auth === 'oauth';
  const isShopify = form.platform === 'Shopify';
  const region = form.region || platform.regions?.[0] || '';
  const bind = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const storeEnvSuffix = String(store.id || '').toUpperCase().replace(/[^A-Z0-9]/g, '_');

  // New marketplace stores default to the Marketplaces group, and back out of it for key-based ones.
  const changePlatform = (next) => {
    const market = groups.find((g) => g.id === MARKET_GROUP);
    setForm((f) => ({
      ...f,
      platform: next,
      region: PLATFORMS[next].regions?.[0] || '',
      groupId:
        isNew && market
          ? isOAuthPlatform(next)
            ? market.id
            : f.groupId === market.id
              ? groups[0].id
              : f.groupId
          : f.groupId,
    }));
    setTest(null);
    setErrors({});
  };

  const validate = () => {
    const next = {};
    if (usesOAuth) {
      // Marketplace sign-in isn't built yet: the store can be saved by name to organize clients.
      if (!form.name.trim()) next.name = 'Store name is required.';
    } else {
      if (!form.name.trim()) next.name = 'Store name is required.';
      if (isShopify && !/^[a-z0-9-]+\.myshopify\.com$/i.test(form.url.replace(/^https?:\/\//, ''))) {
        next.url = 'Use the store’s myshopify.com address.';
      }
      if (!isShopify && !/^https:\/\/[^\s.]+\.[^\s]+$/i.test(form.url)) next.url = 'Use the full https:// address of the WordPress site.';
    }
    setErrors(next);
    return !Object.keys(next).length;
  };

  const runTest = async () => {
    if (!validate()) return;
    if (!store.id) {
      setTest({ state: 'fail', message: 'Save the store first, then configure its server-side Netlify credentials before testing.' });
      return;
    }
    setTest({ state: 'checking' });
    const result = await testConnection({
      platform: form.platform,
      storeId: store.id,
    });
    setTest({ state: result.ok ? 'ok' : 'fail', message: result.message });
  };

  const submit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    const base = { ...store, platform: form.platform, name: form.name.trim(), groupId: form.groupId, syncFrequency: form.syncFrequency, status: form.status };

    if (usesOAuth) {
      saveStore({ ...base, url: store.url || '', region, keyHint: 'Not connected' }, isNew, form.clientId);
    } else {
      // Keys are stored in the admin-only PocketBase collection; only the last 4 characters are shown here.
      const { accountId: _a, region: _r, ...rest } = base;
      saveStore(
        {
          ...rest,
          url: form.url.trim().replace(/\/$/, ''),
            keyHint: form.platform === 'WooCommerce' ? 'Netlify environment' : 'Not connected',
        },
        isNew,
        form.clientId,
      );
    }
    onClose();
  };

  return (
    <Modal
      title={isNew ? 'Add integration' : `Edit ${store.name}`}
      subtitle={!isNew && <StoreBadge store={{ ...store, platform: form.platform }} api showStore={false} />}
      size="lg"
      onClose={onClose}
      footer={
        <>
          <Button className="mr-auto" onClick={runTest}>
            <Zap size={15} /> Test connection
          </Button>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" form="integration-form" variant="primary">
            {isNew ? 'Connect store' : 'Save changes'}
          </Button>
        </>
      }
    >
      <form id="integration-form" onSubmit={submit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Platform" hint={usesOAuth ? 'Connects with the seller’s login (OAuth).' : 'Credentials are configured server-side in Netlify.'}>
              // Only non-secret store metadata is saved by the browser.
            <Select value={form.platform} onChange={changePlatform} options={PLATFORM_NAMES.map((p) => ({ value: p, label: p }))} />
          </Field>
          <Field label="Store name" error={errors.name}>
            <input
              className={ui.input}
              value={form.name}
              onChange={bind('name')}
              placeholder={usesOAuth ? 'e.g. Summit Gear Direct' : 'e.g. Harbor Coffee Co.'}
            />
          </Field>
        </div>

        <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
          <p className={`mb-3 flex items-center gap-2 text-sm font-medium ${ui.h}`}>
            {usesOAuth ? <Shield size={15} /> : <KeyRound size={15} />} {usesOAuth ? 'Seller authorization' : 'API credentials'}
          </p>
          {isShopify && (
            <div className="mb-3">
              <Callout icon={TriangleAlert} tone="warning">
                Live sync for Shopify isn't built yet. The store is saved, but products and orders won't come in. WooCommerce syncs today.
              </Callout>
            </div>
          )}
          {usesOAuth ? (
            <Callout icon={TriangleAlert} tone="warning">
              Signing in with {form.platform} isn't available yet, so this store won't sync. You can still save it to organize clients and groups.
            </Callout>
          ) : (
            <div className="space-y-4">
              <Field label={isShopify ? 'Shopify address' : 'Site URL'} error={errors.url}>
                <input
                  className={ui.input}
                  value={form.url}
                  onChange={bind('url')}
                  placeholder={isShopify ? 'your-store.myshopify.com' : 'https://your-store.com'}
                />
              </Field>
              {form.platform === 'WooCommerce' && (
                <Callout tone="info">
                  WooCommerce credentials are configured only in Netlify, never in this browser. {store.id
                    ? `Store ID: ${store.id}. Add WC_STORE_${storeEnvSuffix}_CONSUMER_KEY, WC_STORE_${storeEnvSuffix}_CONSUMER_SECRET, and WC_STORE_${storeEnvSuffix}_WEBHOOK_SECRET in Netlify.`
                    : 'Save the store first to generate its Store ID and environment variable names.'}
                </Callout>
              )}
            </div>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Store group">
            <Select value={form.groupId} onChange={(v) => setForm((f) => ({ ...f, groupId: v }))} options={groups.map((g) => ({ value: g.id, label: g.name }))} />
          </Field>
          <Field label="Sync every">
            <Select
              value={form.syncFrequency}
              onChange={(v) => setForm((f) => ({ ...f, syncFrequency: v }))}
              options={[
                { value: 'default', label: 'Workspace default' },
                { value: '5', label: '5 minutes' },
                { value: '15', label: '15 minutes' },
                { value: '60', label: 'Hour' },
                { value: 'manual', label: 'Manual only' },
              ]}
            />
          </Field>
          <Field label="Status">
            <Select
              value={form.status}
              onChange={(v) => setForm((f) => ({ ...f, status: v }))}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'paused', label: 'Paused' },
              ]}
            />
          </Field>
        </div>

        {isNew && (
          <Field label="Give a client access (optional)" hint="You can change this any time on the Clients page.">
            <Select
              value={form.clientId}
              onChange={(v) => setForm((f) => ({ ...f, clientId: v }))}
              options={[{ value: '', label: 'No client yet' }, ...clients.map((c) => ({ value: c.id, label: c.company }))]}
            />
          </Field>
        )}

        {test?.state === 'checking' && (
          <Callout icon={RefreshCw} tone="info">
            Checking…
          </Callout>
        )}
        {test?.state === 'ok' && (
          <Callout icon={CircleCheck} tone="success">
            {test.message}
          </Callout>
        )}
        {test?.state === 'fail' && (
          <Callout icon={TriangleAlert} tone="danger">
            {test.message}
          </Callout>
        )}
      </form>
    </Modal>
  );
}
