import { useCallback, useEffect, useRef, useState } from 'react';
import { deleteRecord, findRecord, normalizeRecord, pb, saveRecord } from './pocketbase';

export function stableStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value ?? null);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  return `{${Object.keys(value)
    .filter((key) => value[key] !== undefined && key !== '_pbId')
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
    .join(',')}}`;
}

async function fetchSource(source) {
  const collection = pb.collection(source.collection);
  if (source.recordId) return [normalizeRecord(await collection.getOne(source.recordId))];
  const records = await collection.getFullList({ filter: source.filter, sort: source.sort });
  return records.map(normalizeRecord);
}

export async function writeDiff(collectionName, previous, next, { softDelete } = {}) {
  const before = new Map(previous.map((record) => [record.id, record]));
  const operations = [];
  next.forEach((record) => {
    const oldRecord = before.get(record.id);
    if (!oldRecord || stableStringify(oldRecord) !== stableStringify(record)) operations.push(['save', record]);
    before.delete(record.id);
  });
  before.forEach((record) => operations.push([softDelete ? 'soft-delete' : 'delete', record]));

  for (const [operation, record] of operations) {
    const collection = pb.collection(collectionName);
    const { id, _pbId, ...payload } = record;
    if (operation === 'delete') {
      if (_pbId) await collection.delete(_pbId);
      else await deleteRecord(collectionName, id);
    } else if (operation === 'soft-delete') {
      const patch = { ...payload, ...softDelete(record) };
      if (_pbId) await collection.update(_pbId, patch);
      else await saveRecord(collectionName, id, patch);
    } else if (_pbId) {
      await collection.update(_pbId, payload);
    } else {
      await saveRecord(collectionName, id, payload);
    }
  }
  return operations.length;
}

export function useLiveList(collectionName, sources, { sort, softDelete, onError } = {}) {
  const [list, setListState] = useState([]);
  const [loading, setLoading] = useState(true);
  const listRef = useRef([]);
  const optionsRef = useRef({ sort, softDelete, onError });
  optionsRef.current = { sort, softDelete, onError };

  const key = sources?.map((source) => [source.key, source.collection, source.recordId, source.filter, source.sort].join(':')).join('|') || 'off';

  useEffect(() => {
    let active = true;
    const parts = new Map();
    const unsubscribers = [];

    if (!sources?.length) {
      listRef.current = [];
      setListState([]);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    const emit = () => {
      const merged = new Map();
      parts.forEach((records) => records.forEach((record) => merged.set(record.id, record)));
      let records = [...merged.values()].filter((record) => !record.pendingDelete);
      if (optionsRef.current.sort) records = records.sort(optionsRef.current.sort);
      listRef.current = records;
      setListState(records);
      if (parts.size === sources.length) setLoading(false);
    };

    const refresh = async (source) => {
      try {
        const records = await fetchSource(source);
        if (!active) return;
        parts.set(source.key, new Map(records.map((record) => [record.id, record])));
      } catch (error) {
        if (!active) return;
        optionsRef.current.onError?.(error, collectionName);
        parts.set(source.key, new Map());
      }
      emit();
    };

    sources.forEach((source) => {
      pb.collection(source.collection).subscribe('*', () => refresh(source)).then((unsubscribe) => {
        if (active) unsubscribers.push(unsubscribe);
        else unsubscribe();
      }).catch((error) => {
        optionsRef.current.onError?.(error, collectionName);
      });
      refresh(source);
    });

    return () => {
      active = false;
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
    // Sources are intentionally represented by a stable descriptor key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionName, key]);

  const setList = useCallback((updater) => {
    const previous = listRef.current;
    const next = typeof updater === 'function' ? updater(previous) : updater;
    listRef.current = next;
    setListState(next);
    const { softDelete: markDeleted, onError: report } = optionsRef.current;
    return writeDiff(collectionName, previous, next, { softDelete: markDeleted }).catch((error) => {
      report?.(error, collectionName);
      throw error;
    });
  }, [collectionName]);

  return [list, setList, loading];
}

export function useLiveDoc(path, { onError } = {}) {
  const [data, setData] = useState(null);
  const [collectionName, externalId] = path?.split('/') || [];

  useEffect(() => {
    if (!collectionName || !externalId) return undefined;
    let active = true;
    const refresh = async () => {
      try {
        const record = await findRecord(collectionName, externalId);
        if (active) setData(normalizeRecord(record) || {});
      } catch (error) {
        onError?.(error, path);
        if (active) setData({});
      }
    };
    let unsubscribe;
    pb.collection(collectionName).subscribe('*', refresh).then((stop) => {
      if (active) unsubscribe = stop;
      else stop();
    }).catch((error) => onError?.(error, path));
    refresh();
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [collectionName, externalId, onError, path]);

  const update = useCallback(async (patch) => {
    setData((current) => ({ ...(current || {}), ...patch }));
    try {
      const saved = await saveRecord(collectionName, externalId, patch);
      setData(normalizeRecord(saved));
      return saved;
    } catch (error) {
      onError?.(error, path);
      throw error;
    }
  }, [collectionName, externalId, onError, path]);

  return [data, update];
}

export function waitForSync(collectionName, externalId, timeoutMs = 90000) {
  return new Promise((resolve) => {
    let unsubscribe;
    let finished = false;
    const finish = (result) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      unsubscribe?.();
      resolve(result);
    };
    const check = async () => {
      try {
        const record = await findRecord(collectionName, externalId);
        if (!record) return finish({ state: 'gone' });
        if (record.syncState !== 'pending') finish({ state: record.syncState, error: record.syncError, data: normalizeRecord(record) });
      } catch (error) {
        finish({ state: 'error', error: error.message });
      }
    };
    const timer = setTimeout(() => finish({ state: 'timeout' }), timeoutMs);
    pb.collection(collectionName).subscribe('*', ({ record }) => {
      if (record?.recordKey === externalId) check();
    }).then((stop) => {
      if (finished) stop();
      else unsubscribe = stop;
    }).catch((error) => finish({ state: 'error', error: error.message }));
    check();
  });
}
