import { createHmac, timingSafeEqual } from 'node:crypto';
import {
  getRecordByKey,
  getWooCredentials,
  recordKeyForStore,
  storeEnvSuffix,
  upsertByKey,
} from './pocketbase.mjs';

const PAGE_SIZE = 100;
const MAX_PAGES = 100;

function numberOrNull(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function dateMilliseconds(value) {
  if (!value) return Date.now();
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : Date.now();
}

function productRecord(store, product) {
  const id = String(product.id);
  const stock = product.stock_quantity === null ? null : numberOrNull(product.stock_quantity);
  return {
    storeId: store.recordKey,
    externalId: id,
    title: product.name || `Product ${id}`,
    category: (product.categories || []).map((category) => category.name).join(', '),
    price: numberOrNull(product.price) ?? 0,
    stock,
    sku: product.sku || '',
    status: product.status === 'publish' ? 'active' : 'draft',
    syncState: 'synced',
    syncError: '',
    pendingDelete: false,
    editedAt: Date.now(),
  };
}

function customerRecord(store, customer) {
  const id = String(customer.id);
  return {
    storeId: store.recordKey,
    name: [customer.first_name, customer.last_name].filter(Boolean).join(' ') || customer.username || customer.email || `Customer ${id}`,
    email: customer.email || '',
    orderCount: numberOrNull(customer.orders_count) ?? 0,
    spent: numberOrNull(customer.total_spent) ?? 0,
  };
}

function orderRecord(store, order) {
  const id = String(order.id);
  const items = (order.line_items || []).map((item) => ({
    productId: item.product_id ? recordKeyForStore(store.recordKey, 'product', item.product_id) : '',
    title: item.name || 'Item',
    qty: numberOrNull(item.quantity) ?? 0,
    price: numberOrNull(item.price) ?? 0,
  }));
  const statusMap = {
    completed: 'fulfilled',
    processing: 'processing',
    pending: 'unfulfilled',
    'on-hold': 'unfulfilled',
    cancelled: 'cancelled',
    refunded: 'refunded',
    failed: 'cancelled',
  };
  const shipping = (order.shipping_lines || []).reduce((sum, line) => sum + (numberOrNull(line.total) ?? 0), 0);
  const subtotal = (order.line_items || []).reduce((sum, item) => sum + (numberOrNull(item.subtotal) ?? numberOrNull(item.total) ?? 0), 0);
  return {
    storeId: store.recordKey,
    number: String(order.number || id),
    customerId: order.customer_id ? recordKeyForStore(store.recordKey, 'customer', order.customer_id) : '',
    items,
    subtotal,
    shipping,
    total: numberOrNull(order.total) ?? 0,
    status: statusMap[order.status] || 'unfulfilled',
    placedAt: dateMilliseconds(order.date_created_gmt || order.date_created),
    syncState: 'synced',
    syncError: '',
    editedAt: Date.now(),
  };
}

async function fetchWooPage(credentials, resource, page) {
  const url = new URL(`${credentials.url}/wp-json/wc/v3/${resource}`);
  url.searchParams.set('page', String(page));
  url.searchParams.set('per_page', String(PAGE_SIZE));
  const authorization = Buffer.from(`${credentials.consumerKey}:${credentials.consumerSecret}`).toString('base64');
  const response = await fetch(url, {
    headers: { authorization: `Basic ${authorization}`, accept: 'application/json' },
    redirect: 'error',
    signal: AbortSignal.timeout(25000),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message = body?.message || response.statusText || 'WooCommerce request failed.';
    throw new Error(`WooCommerce ${resource} returned ${response.status}: ${message}`);
  }
  if (!Array.isArray(body)) throw new Error(`WooCommerce ${resource} response was not a list.`);
  return body;
}

async function fetchAll(credentials, resource) {
  const records = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const next = await fetchWooPage(credentials, resource, page);
    records.push(...next);
    if (next.length < PAGE_SIZE) return records;
  }
  throw new Error(`WooCommerce ${resource} exceeded ${MAX_PAGES} pages; narrow the sync or increase the pagination limit.`);
}

async function saveProduct(pb, store, product) {
  if (!product?.id) return;
  return upsertByKey(pb, 'products', recordKeyForStore(store.recordKey, 'product', product.id), productRecord(store, product));
}

async function saveCustomer(pb, store, customer) {
  if (!customer?.id) return;
  return upsertByKey(pb, 'customers', recordKeyForStore(store.recordKey, 'customer', customer.id), customerRecord(store, customer));
}

async function saveOrder(pb, store, order) {
  if (!order?.id) return;
  const billing = order.billing || {};
  if (order.customer_id) {
    await saveCustomer(pb, store, {
      id: order.customer_id,
      first_name: billing.first_name,
      last_name: billing.last_name,
      email: billing.email,
    });
  }
  return upsertByKey(pb, 'orders', recordKeyForStore(store.recordKey, 'order', order.id), orderRecord(store, order));
}

export async function syncWooStore(pb, store) {
  if (store.platform !== 'WooCommerce') throw new Error('Only WooCommerce stores can be synced.');
  try {
    const credentials = getWooCredentials(store);
    const [products, orders, customers] = await Promise.all([
      fetchAll(credentials, 'products'),
      fetchAll(credentials, 'orders'),
      fetchAll(credentials, 'customers'),
    ]);

    for (const product of products) await saveProduct(pb, store, product);
    for (const customer of customers) await saveCustomer(pb, store, customer);
    for (const order of orders) await saveOrder(pb, store, order);

    const syncedAt = Date.now();
    await pb.collection('stores').update(store.id, {
      health: 'connected',
      lastSync: syncedAt,
      lastError: '',
      webhooks: store.webhooks || 'configured-manually',
    });
    return { counts: { products: products.length, orders: orders.length, customers: customers.length }, lastSync: syncedAt };
  } catch (error) {
    try {
      await pb.collection('stores').update(store.id, { health: 'error', lastError: error?.message || 'Sync failed.' });
    } catch (saveError) {
      console.error(`Could not persist sync failure for ${store.recordKey}:`, saveError?.message || saveError);
    }
    throw error;
  }
}

export async function testWooConnection(pb, store) {
  const credentials = getWooCredentials(store);
  const products = await fetchWooPage(credentials, 'products', 1);
  return { ok: true, message: `Connected to WooCommerce. ${products.length} products visible on the first page.` };
}

export async function applyWooWebhook(pb, store, topic, payload) {
  if (!topic || !payload || typeof payload !== 'object') throw new Error('Webhook topic or payload is invalid.');
  const type = topic.split('.')[0];
  if (type === 'product') {
    if (topic.endsWith('.deleted')) {
      const record = await getRecordByKey(pb, 'products', recordKeyForStore(store.recordKey, 'product', payload.id));
      await pb.collection('products').delete(record.id);
    } else {
      await saveProduct(pb, store, payload);
    }
  } else if (type === 'order') {
    if (topic.endsWith('.deleted')) {
      const record = await getRecordByKey(pb, 'orders', recordKeyForStore(store.recordKey, 'order', payload.id));
      await pb.collection('orders').delete(record.id);
    } else {
      await saveOrder(pb, store, payload);
    }
  } else if (type === 'customer') {
    if (topic.endsWith('.deleted')) {
      const record = await getRecordByKey(pb, 'customers', recordKeyForStore(store.recordKey, 'customer', payload.id));
      await pb.collection('customers').delete(record.id);
    } else {
      await saveCustomer(pb, store, payload);
    }
  } else {
    throw new Error(`Unsupported WooCommerce webhook topic: ${topic}`);
  }

  await pb.collection('stores').update(store.id, { lastSync: Date.now(), health: 'connected', lastError: '' });
  return { ok: true };
}

export function verifyWooSignature(rawBody, signature, storeId) {
  if (!signature) return false;
  const secretName = `WC_STORE_${storeEnvSuffix(storeId)}_WEBHOOK_SECRET`;
  const secret = process.env[secretName]?.trim();
  if (!secret) throw new Error(`Missing Netlify environment variable ${secretName}.`);
  const expected = createHmac('sha256', secret).update(rawBody).digest();
  let actual;
  try {
    actual = Buffer.from(signature, 'base64');
  } catch {
    return false;
  }
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
