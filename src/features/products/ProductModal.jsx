import { useState } from 'react';
import { Pause, RefreshCw } from 'lucide-react';
import { Badge, StoreBadge } from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Callout from '../../components/ui/Callout';
import Field from '../../components/ui/Field';
import Modal from '../../components/ui/Modal';
import Select from '../../components/ui/Select';
import { useApp } from '../../context/AppContext';
import { isOAuthPlatform, PLATFORMS } from '../../data/platforms';
import { ui } from '../../styles/ui';

// Add / edit form. The badge in the header shows which store API the save goes to.
export default function ProductModal({ product, onClose }) {
  const { scopedStores, storeOf, saveProduct } = useApp();
  const isNew = !product.id;
  const [form, setForm] = useState({
    storeId: product.storeId || scopedStores.find((s) => s.status === 'active')?.id || scopedStores[0]?.id || '',
    title: product.title || '',
    sku: product.sku || '',
    category: product.category || '',
    price: product.price != null ? String(product.price) : '',
    // Empty = the store doesn't track a quantity ("In stock" / "Out of stock" only).
    stock: product.stock != null ? String(product.stock) : product.id ? '' : '0',
    status: product.status || 'active',
  });
  const [errors, setErrors] = useState({});
  const store = storeOf(form.storeId);
  const bind = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    const price = Number(form.price);
    const stock = form.stock.trim() === '' ? null : Number(form.stock);
    const next = {};
    if (!form.storeId) next.storeId = 'Choose a store.';
    if (!form.title.trim()) next.title = 'Title is required.';
    if (form.price === '' || Number.isNaN(price) || price < 0) next.price = 'Enter a valid price.';
    if (stock !== null && (!Number.isInteger(stock) || stock < 0)) next.stock = 'Whole number, 0 or more.';
    setErrors(next);
    if (Object.keys(next).length) return;

    const status = stock === 0 && form.status === 'active' ? 'out_of_stock' : form.status;
    saveProduct(
      {
        ...product,
        ...form,
        title: form.title.trim(),
        sku: form.sku.trim() || `NEW-${Date.now().toString().slice(-5)}`,
        price,
        stock,
        status,
      },
      isNew ? null : product,
    );
    onClose();
  };

  return (
    <Modal
      title={isNew ? 'Add product' : 'Edit product'}
      subtitle={
        store && (
          <div className="flex flex-wrap items-center gap-2">
            <StoreBadge store={store} api />
            {store.status === 'paused' && <Badge status="paused" />}
          </div>
        )
      }
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" form="product-form" variant="primary">
            {isNew ? 'Create and sync' : 'Save and sync'}
          </Button>
        </>
      }
    >
      <form id="product-form" onSubmit={submit} className="space-y-4">
        {isNew && (
          <Field label="Store" error={errors.storeId}>
            <Select
              value={form.storeId}
              onChange={(v) => setForm((f) => ({ ...f, storeId: v }))}
              options={scopedStores.map((s) => ({
                value: s.id,
                label: `${s.name} (${s.platform})${s.status === 'paused' ? ' — paused' : ''}`,
              }))}
            />
          </Field>
        )}
        <Field label="Title" error={errors.title}>
          <input className={ui.input} value={form.title} onChange={bind('title')} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="SKU" hint={isNew ? 'Leave empty to generate one.' : undefined}>
            <input className={ui.input} value={form.sku} onChange={bind('sku')} />
          </Field>
          <Field label="Category">
            <input className={ui.input} value={form.category} onChange={bind('category')} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Price" error={errors.price}>
            <input type="number" step="0.01" min="0" className={ui.input} value={form.price} onChange={bind('price')} />
          </Field>
          <Field label="Stock" error={errors.stock} hint="Leave empty to not track a quantity.">
            <input type="number" step="1" min="0" className={ui.input} value={form.stock} onChange={bind('stock')} />
          </Field>
        </div>
        <Field label="Status">
          <Select
            value={form.status}
            onChange={(v) => setForm((f) => ({ ...f, status: v }))}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'draft', label: 'Draft' },
              { value: 'out_of_stock', label: 'Out of stock' },
            ]}
          />
        </Field>

        {store?.status === 'paused' ? (
          <Callout icon={Pause} tone="warning">
            {store.name} is paused. The change is saved here and sent when syncing resumes.
          </Callout>
        ) : (
          store && (
            <div className={`flex items-start gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-xs dark:border-gray-800 dark:bg-gray-800/40 ${ui.muted}`}>
              <RefreshCw size={14} className="mt-0.5 shrink-0" />
              <span>
                {isNew ? 'Creates the listing' : 'Sends a live update'} through{' '}
                <span className={`font-medium ${ui.h}`}>{PLATFORMS[store.platform].api}</span> to {store.name}
                {!isNew && product.externalId && (
                  <>
                    {' '}
                    ({PLATFORMS[store.platform].idLabel} <span className="font-mono">{product.externalId}</span>)
                  </>
                )}
                .{isOAuthPlatform(store.platform) && ' Marketplace listings can take a few minutes to update on the storefront.'}
              </span>
            </div>
          )
        )}
      </form>
    </Modal>
  );
}
