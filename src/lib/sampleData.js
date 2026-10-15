import { doc, writeBatch } from './firebase/client';
import { clients, customers, groups, orders, products, stores } from '../data';
import { fb } from './firebase/client';

// The demo stores (marked `sample: true`) so the dashboards have something to show.
// The sync functions never contact a real store for them.

const toDoc = ({ id: _id, ...rest }) => JSON.parse(JSON.stringify(rest));

function sampleDocs() {
  const docs = [];
  stores.forEach((s) => docs.push(['stores', s.id, { ...s, sample: true }]));
  groups.forEach((g) => docs.push(['groups', g.id, { ...g, sample: true, storeIds: stores.filter((s) => s.groupId === g.id).map((s) => s.id) }]));
  products.forEach((p) => docs.push(['products', p.id, { ...p, syncState: 'synced' }]));
  orders.forEach((o) => docs.push(['orders', o.id, { ...o, syncState: 'synced' }]));
  customers.forEach((c) => docs.push(['customers', c.id, c]));
  clients.forEach((c) => docs.push(['clients', c.id, { ...c, sample: true }]));
  return docs;
}

async function commit(ops) {
  const { db } = fb();
  for (let i = 0; i < ops.length; i += 450) {
    const batch = writeBatch(db);
    ops.slice(i, i + 450).forEach(([collection, id, data]) => {
      const ref = doc(db, collection, id);
      if (data) batch.set(ref, toDoc(data));
      else batch.delete(ref);
    });
    await batch.commit();
  }
}

export const loadSampleData = () => commit(sampleDocs());

export const removeSampleData = () => commit(sampleDocs().map(([collection, id]) => [collection, id, null]));
