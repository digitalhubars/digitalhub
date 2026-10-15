import PocketBase from 'pocketbase';

export const pocketbaseUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';
export const pocketbaseConfigured = Boolean(pocketbaseUrl);
export const firebaseConfigured = pocketbaseConfigured;

export const pb = new PocketBase(pocketbaseUrl);

const STORE_KEY = 'digital-hub-pb';
const AUTH_KEY = 'digital-hub-auth';

function readStore() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeStore(next) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(next));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('digital-hub-pb'));
    }
  } catch {
    // Ignore storage errors in private browsing or restricted environments.
  }
}

function readAuth() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeAuth(next) {
  try {
    if (next) localStorage.setItem(AUTH_KEY, JSON.stringify(next));
    else localStorage.removeItem(AUTH_KEY);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('digital-hub-auth'));
    }
  } catch {
    // Ignore storage errors.
  }
}

export function collection(_db, name) {
  return { type: 'collection', name };
}

export function doc(_db, ...parts) {
  if (parts.length === 1 && typeof parts[0] === 'string') {
    const [collectionName, ...rest] = parts[0].split('/');
    return { type: 'doc', collection: collectionName, id: rest.join('/') || 'default' };
  }
  const [collectionName, id] = parts;
  return { type: 'doc', collection: collectionName, id: id || 'default' };
}

export function query(collectionRef, ...clauses) {
  return { type: 'query', collection: collectionRef, clauses: clauses.filter(Boolean) };
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

function deepMerge(base, patch) {
  if (!base || typeof base !== 'object' || !patch || typeof patch !== 'object') return patch;
  if (Array.isArray(base) || Array.isArray(patch)) return patch;
  const next = { ...base };
  Object.keys(patch).forEach((key) => {
    const nextValue = patch[key];
    if (nextValue && typeof nextValue === 'object' && !Array.isArray(nextValue) && nextValue !== null && typeof next[key] === 'object' && !Array.isArray(next[key])) {
      next[key] = deepMerge(next[key], nextValue);
    } else {
      next[key] = nextValue;
    }
  });
  return next;
}

function collectionItems(ref) {
  const state = readStore();
  const values = state[ref.name] || {};
  return Object.entries(values).map(([id, value]) => ({ id, ...(value || {}) }));
}

function matchesClause(item, clause) {
  if (!clause || !clause.field) return true;
  const actual = item?.[clause.field];
  if (clause.type === 'where') {
    if (clause.op === '==') return actual === clause.value;
    if (clause.op === '!=') return actual !== clause.value;
    if (clause.op === 'array-contains') return Array.isArray(actual) && actual.includes(clause.value);
    if (clause.op === 'in') return Array.isArray(clause.value) && clause.value.includes(actual);
  }
  return true;
}

function applyQuery(collectionRef, queryRef) {
  const items = collectionItems(collectionRef);
  const filtered = items.filter((item) => (queryRef?.clauses || []).every((clause) => matchesClause(item, clause)));
  const ordered = (queryRef?.clauses || []).filter((clause) => clause.type === 'orderBy').reduce((acc, clause) => {
    const dir = clause.direction === 'desc' ? -1 : 1;
    acc.sort((a, b) => {
      const left = a[clause.field] || 0;
      const right = b[clause.field] || 0;
      if (left < right) return -1 * dir;
      if (left > right) return 1 * dir;
      return 0;
    });
    return acc;
  }, filtered);
  const limited = (queryRef?.clauses || []).filter((clause) => clause.type === 'limit').reduce((acc, clause) => acc.slice(0, clause.value), ordered);
  return limited;
}

export function getAuthSession() {
  return readAuth();
}

export function setAuthSession(next) {
  writeAuth(next);
}

export function clearAuthSession() {
  writeAuth(null);
}

export const fb = () => ({
  app: { options: { projectId: 'pocketbase' } },
  auth: { currentUser: getAuthSession() },
  db: { source: 'pocketbase' },
  functions: {},
});

export async function setDoc(ref, data, options = {}) {
  const state = readStore();
  const collectionData = state[ref.collection] || {};
  const current = collectionData[ref.id] || {};
  const nextValue = options.merge ? deepMerge(current, data) : { ...(data || {}) };
  collectionData[ref.id] = nextValue;
  state[ref.collection] = collectionData;
  writeStore(state);
  return ref;
}

export async function getDoc(ref) {
  const state = readStore();
  const data = state?.[ref.collection]?.[ref.id] || null;
  return {
    id: ref.id,
    exists: !!data,
    data: () => data || {},
    get: () => data || {},
  };
}

export async function getDocs(queryRef) {
  const ref = queryRef?.collection || queryRef;
  const items = queryRef?.type === 'query' ? applyQuery(ref, queryRef) : collectionItems(ref);
  return {
    docs: items.map((item) => ({
      id: item.id,
      data: () => item,
      exists: true,
    })),
  };
}

export async function deleteDoc(ref) {
  const state = readStore();
  if (state[ref.collection]) delete state[ref.collection][ref.id];
  writeStore(state);
}

export async function updateDoc(ref, patch) {
  const current = (readStore()[ref.collection] || {})[ref.id] || {};
  return setDoc(ref, deepMerge(current, patch), { merge: true });
}

export function onSnapshot(refOrQuery, next, onError) {
  const emit = () => {
    try {
      if (!refOrQuery) return next({ exists: false, data: () => ({}) });
      if (refOrQuery.type === 'doc') {
        getDoc(refOrQuery).then((snap) => next(snap)).catch(onError);
      } else {
        getDocs(refOrQuery).then((snap) => next(snap)).catch(onError);
      }
    } catch (err) {
      onError?.(err);
    }
  };
  emit();
  if (typeof window !== 'undefined') {
    const handler = () => emit();
    window.addEventListener('digital-hub-pb', handler);
    return () => window.removeEventListener('digital-hub-pb', handler);
  }
  return () => {};
}

export function writeBatch(db) {
  const ops = [];
  return {
    set(ref, data, options = {}) {
      ops.push(['set', ref, data, options]);
    },
    update(ref, patch) {
      ops.push(['update', ref, patch]);
    },
    delete(ref) {
      ops.push(['delete', ref]);
    },
    async commit() {
      for (const [op, ref, payload, options] of ops) {
        if (op === 'set') await setDoc(ref, payload, options);
        else if (op === 'update') await updateDoc(ref, payload);
        else if (op === 'delete') await deleteDoc(ref);
      }
      return true;
    },
  };
}

export async function call() {
  return {};
}

export const getApps = () => [{ options: { projectId: 'pocketbase' } }];
export const initializeApp = () => ({ options: { projectId: 'pocketbase' } });
