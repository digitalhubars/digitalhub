import { DAY, HOUR, NOW } from './constants';
import { stores } from './stores';
import { products } from './products';
import { customers } from './customers';
import { seededRandom } from '../lib/random';

function orderNumberFor(platform, sequence, rand) {
  const digits = (count) => String(Math.floor(rand() * 10 ** count)).padStart(count, '0');
  if (platform === 'Amazon') return `114-${digits(7)}-${digits(7)}`;
  if (platform === 'eBay') return `12-${String(1e4 + sequence * 37).slice(-5)}-${digits(5)}`;
  if (platform === 'TikTok Shop') return `5768${digits(11)}`;
  return `#${sequence}`;
}

// 130 orders over the last 14 days. The call order of rand() matters: it keeps
// the generated data identical to the original prototype.
function generateOrders() {
  const rand = seededRandom(42);
  const sequences = {};
  const orders = [];

  for (let i = 0; i < 130; i++) {
    const store = stores[Math.floor(rand() * stores.length)];
    const daysAgo = Math.floor(rand() * 14);
    const storeCustomers = customers.filter((c) => c.storeId === store.id);
    const storeProducts = products.filter((p) => p.storeId === store.id);

    const items = [];
    for (let n = 1 + Math.floor(rand() * 3); n > 0; n--) {
      const product = storeProducts[Math.floor(rand() * storeProducts.length)];
      const qty = 1 + Math.floor(rand() * 2);
      const existing = items.find((item) => item.productId === product.id);
      if (existing) existing.qty += qty;
      else items.push({ productId: product.id, title: product.title, qty, price: product.price });
    }

    const subtotal = items.reduce((sum, item) => sum + item.qty * item.price, 0);
    const shipping = subtotal > 100 ? 0 : 6.95;
    const roll = rand();
    const status =
      daysAgo === 0
        ? roll < 0.6 ? 'unfulfilled' : 'processing'
        : roll < 0.72 ? 'fulfilled'
        : roll < 0.84 ? 'processing'
        : roll < 0.93 ? 'unfulfilled'
        : 'refunded';

    sequences[store.id] = (sequences[store.id] || (store.platform === 'Shopify' ? 1000 : 4400)) + 1;

    const number = orderNumberFor(store.platform, sequences[store.id], rand);
    const customerId = storeCustomers[Math.floor(rand() * storeCustomers.length)].id;
    const placedAt = NOW - daysAgo * DAY - Math.floor(rand() * 10) * HOUR;

    orders.push({
      id: `o_${i + 1}`,
      number,
      storeId: store.id,
      customerId,
      items,
      subtotal,
      shipping,
      total: subtotal + shipping,
      status,
      placedAt,
    });
  }

  return orders.sort((a, b) => b.placedAt - a.placedAt);
}

export const orders = generateOrders();
