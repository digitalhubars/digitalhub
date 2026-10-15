import { clients, customers, groups, orders, products, stores } from '../data';
import { deleteRecord, saveRecord } from './pocketbase';

const toRecord = ({ id: _id, ...record }) => JSON.parse(JSON.stringify(record));

function sampleRecords() {
  const records = [];
  stores.forEach((store) => records.push(['stores', store.id, { ...store, sample: true }]));
  groups.forEach((group) => records.push(['groups', group.id, {
    ...group,
    sample: true,
    storeIds: stores.filter((store) => store.groupId === group.id).map((store) => store.id),
  }]));
  products.forEach((product) => records.push(['products', product.id, { ...product, syncState: 'synced' }]));
  orders.forEach((order) => records.push(['orders', order.id, { ...order, syncState: 'synced' }]));
  customers.forEach((customer) => records.push(['customers', customer.id, customer]));
  clients.forEach((client) => records.push(['clients', client.id, { ...client, sample: true }]));
  return records;
}

async function commit(records) {
  for (const [collectionName, externalId, data] of records) {
    if (data) await saveRecord(collectionName, externalId, toRecord(data));
    else await deleteRecord(collectionName, externalId);
  }
}

export const loadSampleData = () => commit(sampleRecords());
export const removeSampleData = () => commit(sampleRecords().map(([collectionName, id]) => [collectionName, id, null]));
