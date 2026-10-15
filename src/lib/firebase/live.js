import { useCallback, useEffect, useRef, useState } from 'react';
import { doc, fb, onSnapshot, setDoc, writeBatch } from './client';

export function stableStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value ?? null);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  return `{${Object.keys(value)
    .filter((k) => value[k] !== undefined)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`)
    .join(',')}}`;
}

const toDoc = ({ id: _id, ...rest }) => JSON.parse(JSON.stringify(rest));

export async function writeDiff(name, prev, next, { softDelete, merge } = {}) {
  const { db } = fb();
  const before = new Map(prev.map((d) => [d.id, d]));
  const ops = [];
  next.forEach((item) => {
    const old = before.get(item.id);
    if (!old || stableStringify(old) !== stableStringify(item)) ops.push(['set', item]);
    before.delete(item.id);
  });
  before.forEach((item) => ops.push([softDelete ? 'soft' : 'delete', item]));

  for (let i = 0; i < ops.length; i += 450) {
    const batch = writeBatch(db);
    ops.slice(i, i + 450).forEach(([op, item]) => {
      const ref = doc(db, name, item.id);
      if (op === 'set') batch.set(ref, toDoc(item), merge ? { merge: true } : {});
      else if (op === 'soft') batch.set(ref, { ...toDoc(item), ...softDelete(item) });
      else batch.delete(ref);
    });
    await batch.commit();
  }
  return ops.length;
}

export function useLiveList(name, sources, { sort, softDelete, merge, onError } = {}) {
  const [list, setListState] = useState([]);
  const [loading, setLoading] = useState(true);
  const listRef = useRef([]);
  const optionsRef = useRef({ sort, softDelete, merge, onError });
  optionsRef.current = { sort, softDelete, merge, onError };

  const key = sources ? sources.map((s) => s.key).join('|') : 'off';

  useEffect(() => {
    if (!sources || !sources.length) {
      listRef.current = [];
      setListState([]);
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    const parts = new Map();
    const emit = () => {
      const merged = new Map();
      parts.forEach((m) => m.forEach((v, k) => merged.set(k, v)));
      let arr = [...merged.values()].filter((d) => !d.pendingDelete);
      if (optionsRef.current.sort) arr = arr.sort(optionsRef.current.sort);
      listRef.current = arr;
      setListState(arr);
      if (parts.size === sources.length) setLoading(false);
    };
    const unsubs = sources.map(({ key: partKey, ref }) =>
      onSnapshot(
        ref,
        (snap) => {
          const m = new Map();
          if (snap.docs) snap.docs.forEach((d) => m.set(d.id, { id: d.id, ...d.data() }));
          else if (snap.exists()) m.set(snap.id, { id: snap.id, ...snap.data() });
          parts.set(partKey, m);
          emit();
        },
        (err) => {
          console.warn(`[live] ${name}/${partKey}:`, err.code || err.message);
          parts.set(partKey, new Map());
          emit();
        },
      ),
    );
    return () => unsubs.forEach((u) => u());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, key]);

  const setList = useCallback(
    (updater) => {
      const prev = listRef.current;
      const next = typeof updater === 'function' ? updater(prev) : updater;
      listRef.current = next;
      setListState(next);
      const { softDelete: sd, merge: mg, onError: report } = optionsRef.current;
      return writeDiff(name, prev, next, { softDelete: sd, merge: mg }).catch((err) => {
        report?.(err, name);
        throw err;
      });
    },
    [name],
  );

  return [list, setList, loading];
}

export function useLiveDoc(path, { onError } = {}) {
  const [data, setData] = useState(null);
  useEffect(() => {
    if (!path) return undefined;
    return onSnapshot(
      doc(fb().db, path),
      (snap) => setData(snap.exists() ? snap.data() : {}),
      (err) => {
        console.warn(`[live] ${path}:`, err.code || err.message);
        setData({});
      },
    );
  }, [path]);

  const update = useCallback(
    async (patch) => {
      setData((d) => ({ ...(d || {}), ...patch }));
      return setDoc(doc(fb().db, path), JSON.parse(JSON.stringify(patch)), { merge: true }).catch((err) => {
        onError?.(err, path);
        throw err;
      });
    },
    [path, onError],
  );

  return [data, update];
}

export function waitForSync(collection, id, timeoutMs = 90000) {
  return new Promise((resolve) => {
    let timer;
    const unsub = onSnapshot(
      doc(fb().db, collection, id),
      (snap) => {
        const data = snap.exists() ? snap.data() : null;
        if (!data) {
          finish({ state: 'gone' });
        } else if (data.syncState !== 'pending') {
          finish({ state: data.syncState, error: data.syncError, data });
        }
      },
      (err) => finish({ state: 'error', error: err.message }),
    );
    function finish(result) {
      clearTimeout(timer);
      unsub();
      resolve(result);
    }
    timer = setTimeout(() => finish({ state: 'timeout' }), timeoutMs);
  });
}
