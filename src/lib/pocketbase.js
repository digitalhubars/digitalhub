import PocketBase from 'pocketbase';

const pbUrl = process.env.NEXT_PUBLIC_PB_URL || process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';

export const pb = new PocketBase(pbUrl);
export const pbConfigured = Boolean(pbUrl);

export const getPb = () => pb;

export function normalizeRecord(record) {
  if (!record) return null;
  return { ...record, id: record.id || record._id || record.uid || record.email || 'unknown' };
}

export function getCurrentUser() {
  const model = pb.authStore.model;
  if (!model) return null;
  return { ...model, id: model.id, uid: model.id, displayName: model.full_name || model.name || model.email || '' };
}

export function watchAuth(callback) {
  callback(getCurrentUser());
  const onChange = (token, model) => {
    callback(model ? { ...model, id: model.id, uid: model.id, displayName: model.full_name || model.name || model.email || '' } : null);
  };
  pb.authStore.onChange(onChange);
  return () => undefined;
}

export function collection(_db, name) {
  return { collection: name };
}

export function doc(_db, name, id) {
  if (arguments.length === 2 && typeof name === 'string' && name.includes('/')) {
    const [collectionName, recordId] = name.split('/');
    return { collection: collectionName, id: recordId || '' };
  }

  if (arguments.length === 2 && typeof name === 'string' && !id) {
    return { collection: name, id: '' };
  }

  return { collection: name, id: id || '' };
}

export function query(collectionRef, ...clauses) {
  return { collection: collectionRef?.collection || collectionRef, clauses: clauses.filter(Boolean) };
}

export function where(field, op, value) {
  return { type: 'where', field, op, value };
}

export function orderBy(field, direction = 'asc') {
  return { type: 'orderBy', field, direction };
}

export function limit(value) {
  return { type: 'limit', value };
}

export function arrayRemove(value) {
  return { __arrayRemove: true, value };
}

function convertFilterValue(op, value) {
  if (op === '==') return `${value}`;
  if (op === '!=') return `${value}`;
  if (op === 'array-contains') return value;
  return value;
}

function toPocketBaseFilter(clauses = []) {
  const filters = [];
  clauses.forEach((clause) => {
    if (clause?.type !== 'where') return;
    const field = clause.field;
    const op = clause.op;
    const value = clause.value;

    if (op === '==') filters.push(`${field} = "${String(value)}"`);
    else if (op === '!=') filters.push(`${field} != "${String(value)}"`);
    else if (op === 'array-contains') filters.push(`${field} ~ "${String(value)}"`);
    else if (op === 'in') {
      const list = Array.isArray(value) ? value.map((entry) => `"${String(entry)}"`).join(', ') : `"${String(value)}"`;
      filters.push(`${field} in [${list}]`);
    }
  });

  return filters.join(' && ');
}

function toSortString(clauses = []) {
  const orderBy = clauses.find((clause) => clause?.type === 'orderBy');
  if (!orderBy) return '';
  return `${orderBy.field}${orderBy.direction === 'desc' ? ' desc' : ''}`;
}

function toLimitValue(clauses = []) {
  const limitClause = clauses.find((clause) => clause?.type === 'limit');
  return limitClause ? Number(limitClause.value) : 500;
}

export async function getDocs(refOrQuery) {
  const collectionName = refOrQuery?.collection || refOrQuery?.name || refOrQuery;
  if (!collectionName) return { docs: [] };

  const resource = pb.collection(collectionName);
  const clauses = refOrQuery?.clauses || [];
  const params = {};
  const filter = toPocketBaseFilter(clauses);
  const sort = toSortString(clauses);
  const limit = toLimitValue(clauses);

  if (filter) params.filter = filter;
  if (sort) params.sort = sort;

  const result = await resource.getList(1, limit, params);
  return {
    docs: result.items.map((item) => ({
      id: item.id,
      data: () => item,
      exists: true,
      ...item,
    })),
  };
}

export async function getDoc(ref) {
  if (!ref || !ref.collection) {
    return { exists: false, data: () => ({}) };
  }

  if (!ref.id) {
    return { exists: false, data: () => ({}) };
  }

  try {
    const record = await pb.collection(ref.collection).getOne(ref.id);
    return { id: record.id, exists: true, data: () => record };
  } catch (err) {
    if (err?.status === 404) {
      return { exists: false, data: () => ({}) };
    }
    throw err;
  }
}

export async function setDoc(ref, data, options = {}) {
  if (!ref || !ref.collection) return null;

  const payload = JSON.parse(JSON.stringify(data || {}));
  const collection = pb.collection(ref.collection);

  if (!ref.id || ref.id === 'default') {
    const created = await collection.create(payload);
    return created;
  }

  try {
    const existing = await collection.getOne(ref.id);
    if (options.merge) {
      const merged = { ...existing, ...payload };
      return await collection.update(ref.id, merged);
    }
    return await collection.update(ref.id, payload);
  } catch (err) {
    if (err?.status === 404) {
      return await collection.create({ ...payload, id: ref.id });
    }
    throw err;
  }
}

export async function updateDoc(ref, patch) {
  return setDoc(ref, patch, { merge: true });
}

export async function deleteDoc(ref) {
  if (!ref || !ref.collection || !ref.id) return null;
  try {
    await pb.collection(ref.collection).delete(ref.id);
    return true;
  } catch (err) {
    if (err?.status === 404) return false;
    throw err;
  }
}

export function onSnapshot(refOrQuery, next, onError) {
  const run = async () => {
    try {
      if (!refOrQuery) {
        next({ exists: false, data: () => ({}) });
        return;
      }

      if (refOrQuery.collection && refOrQuery.id) {
        const item = await getDoc(refOrQuery);
        next(item);
        return;
      }

      const list = await getDocs(refOrQuery);
      next(list);
    } catch (err) {
      onError?.(err);
    }
  };

  run();
  return () => {};
}

export function writeBatch(_db) {
  const ops = [];
  return {
    set(ref, data, options = {}) {
      ops.push(['set', ref, data, options]);
    },
    update(ref, data) {
      ops.push(['update', ref, data]);
    },
    delete(ref) {
      ops.push(['delete', ref]);
    },
    async commit() {
      for (const [op, ref, payload] of ops) {
        if (op === 'set') await setDoc(ref, payload, { merge: true });
        else if (op === 'update') await updateDoc(ref, payload);
        else if (op === 'delete') await deleteDoc(ref);
      }
    },
  };
}

export const call = async () => ({});

export const fb = () => ({
  app: { options: { projectId: 'pocketbase' } },
  auth: { currentUser: getCurrentUser() },
  db: pb,
  functions: {},
});

export const getApps = () => [{ options: { projectId: 'pocketbase' } }];
export const initializeApp = () => ({ options: { projectId: 'pocketbase' } });
