import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { call, pb, saveRecord } from '../lib/pocketbase';
import { defaultSettings, isOAuthPlatform, PLATFORMS, sessions as initialSessions } from '../data';
import { canVisitPage, NAV_ITEMS, routePath, settingsTabsFor } from '../config/navigation';
import { getAccess } from '../config/roles';
import { signOut as appSignOut, updateOwnProfile, authMessage } from '../lib/auth';
import { useLiveDoc, useLiveList, waitForSync } from '../lib/live';
import { diffFields, formatMoney, uid } from '../lib/format';
import { removeStoreData } from '../lib/removeStoreData';
import { loadSampleData as seedSampleData, removeSampleData as clearSampleData } from '../lib/sampleData';
import { workspaceToFile } from '../lib/storage';
import { STATUS } from '../styles/ui';

const AppContext = createContext(null);

export const useApp = () => useContext(AppContext);

const withoutKey = (obj, key) => {
  const { [key]: _removed, ...rest } = obj;
  return rest;
};

const byNewest = (field) => (a, b) => (b[field] || 0) - (a[field] || 0);

const callError = (err) =>
  err?.response?.message || err?.message || 'The PocketBase sync endpoint is unavailable.';

/**
 * profile: the signed-in user's PocketBase users record (role, group_id, client_id…)
 * route:    { env, page, tab } parsed from the URL; `env` is the dashboard being viewed
 * navigate: (path, { replace }) => void
 */
export function AppProvider({ children, profile: initialProfile, route, navigate, rolePermissions = {} }) {
  // ---- Session -------------------------------------------------------------
  // `realRole` comes from the signed-in user's PocketBase record.
  // `role` is the dashboard on screen: always realRole, except admins can open any.
  const [profile, setProfile] = useState(initialProfile);
  useEffect(() => setProfile(initialProfile), [initialProfile]);
  const realRole = profile.role;
  const isAdmin = realRole === 'admin';
  const role = isAdmin ? route.env : realRole;
  const page = route.page;
  const settingsTab = route.tab;
  // Admin-only: which manager / client to preview.
  const [viewAs, setViewAs] = useState({ manager: '', client: '' });
  const isPreview = isAdmin && role !== 'admin';

  const setRole = (next) => {
    if (isAdmin) navigate(routePath(next));
  };

  // ---- Feedback (declared early: data hooks report write errors here) -------
  const [toast, setToast] = useState(null);
  const showToast = useCallback((t) => setToast(t), []);
  const dismissToast = () => setToast(null);
  const reportWriteError = useCallback(
    (err, name) => showToast({ tone: 'danger', title: 'Couldn’t save', body: `${name}: ${err.code === 'permission-denied' ? 'you don’t have access to change this.' : err.message}` }),
    [showToast],
  );

  useEffect(() => {
    if (!toast || toast.pending) return undefined;
    const timer = setTimeout(() => setToast(null), toast.payload ? 7000 : 4500);
    return () => clearTimeout(timer);
  }, [toast]);

  // ---- Live data from PocketBase ---------------------------------------------
  // Collection API rules must enforce these role-based scopes on the server.
  const myGroup = profile.group_id;
  const myClient = profile.client_id;
  const live = { onError: reportWriteError };

  const [groups, setGroups] = useLiveList('groups', [{ key: 'all', collection: 'groups' }], live);
  const [clients, setClients] = useLiveList(
    'clients',
    isAdmin
      ? [{ key: 'all', collection: 'clients' }]
      : realRole === 'staff' && myClient
        ? [{ key: myClient, collection: 'clients', filter: pb.filter('recordKey = {:id}', { id: myClient }) }]
        : [],
    live,
  );

  const visibleStoreIds = useMemo(() => {
    if (isAdmin) return null; // everything
    if (realRole === 'manager') return groups.find((g) => g.id === myGroup)?.storeIds || [];
    return clients.find((c) => c.id === myClient)?.storeIds || [];
  }, [isAdmin, realRole, groups, clients, myGroup, myClient]);

  const perStore = (name) =>
    isAdmin
      ? [{ key: 'all', collection: name }]
      : (visibleStoreIds || []).map((id) => ({ key: id, collection: name, filter: pb.filter('storeId = {:id}', { id }) }));

  const storeSources = isAdmin
    ? [{ key: 'all', collection: 'stores' }]
    : realRole === 'manager' && myGroup
      ? [{ key: `g:${myGroup}`, collection: 'stores', filter: pb.filter('groupId = {:id}', { id: myGroup }) }]
      : (visibleStoreIds || []).map((id) => ({ key: id, collection: 'stores', filter: pb.filter('recordKey = {:id}', { id }) }));

  const [stores, setStores] = useLiveList('stores', storeSources, live);
  const [products, setProducts] = useLiveList('products', perStore('products'), {
    ...live,
    sort: (a, b) => (a.title || '').localeCompare(b.title || ''),
    // Deleting a product asks the sync function to delete it in the store first.
    softDelete: () => ({ pendingDelete: true, syncState: 'pending', updatedBy: profile.id, editedAt: Date.now() }),
  });
  const [orders, setOrders] = useLiveList('orders', perStore('orders'), { ...live, sort: byNewest('placedAt') });
  const [customerRecords] = useLiveList('customers', perStore('customers'), live);
  const [users] = useLiveList('users', isAdmin ? [{ key: 'all', collection: 'users' }] : [], live);
  const [activity, setActivity] = useLiveList(
    'activity',
    isAdmin ? [{ key: 'recent', collection: 'activity', sort: '-at' }] : [],
    { ...live, sort: byNewest('at') },
  );
  const [notifications, setNotifications] = useLiveList(
    'notifications',
    isAdmin ? [{ key: 'recent', collection: 'notifications', sort: '-at' }] : [],
    { ...live, sort: byNewest('at') },
  );
  const [settingsDoc, updateSettingsDoc] = useLiveDoc('workspace/settings', live);
  const settings = useMemo(() => ({ ...defaultSettings, ...(settingsDoc || {}) }), [settingsDoc]);
  const [sessions, setSessions] = useState(initialSessions);

  // Each group lists its stores (the security rules use this to scope managers).
  // The admin's browser keeps it in step with the stores' groupId.
  const groupSyncRef = useRef('');
  useEffect(() => {
    if (!isAdmin || !groups.length) return;
    const signature = groups.map((g) => `${g.id}:${stores.filter((s) => s.groupId === g.id).map((s) => s.id).sort().join(',')}`).join('|');
    const drift = groups.some((g) => {
      const expected = stores.filter((s) => s.groupId === g.id).map((s) => s.id).sort().join(',');
      return expected !== [...(g.storeIds || [])].sort().join(',');
    });
    if (drift && groupSyncRef.current !== signature) {
      groupSyncRef.current = signature; // one attempt per change, so a failed write can't loop
      setGroups((list) => list.map((g) => ({ ...g, storeIds: stores.filter((s) => s.groupId === g.id).map((s) => s.id) }))).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, stores, groups]);

  // People, shaped like the old team list (used for previews and pickers).
  const team = useMemo(
    () => users.map((u) => ({ id: u.id, name: u.full_name || u.email, email: u.email, role: u.role, groupId: u.group_id, status: u.status })),
    [users],
  );

  // ---- UI state ------------------------------------------------------------
  const [search, setSearch] = useState('');
  const [syncingStores, setSyncingStores] = useState({}); // storeId -> true while syncing
  const [drawer, setDrawer] = useState(null); // { type: 'order' | 'customer', id }
  const [confirmDialog, setConfirmDialog] = useState(null);
  const mainRef = useRef(null);

  // Products waiting for the store to confirm an edit.
  const syncing = useMemo(() => Object.fromEntries(products.filter((p) => p.syncState === 'pending').map((p) => [p.id, true])), [products]);

  // ---- Theme (per browser) ---------------------------------------------------
  const [themePref, setThemePrefState] = useState(() => {
    try {
      return localStorage.getItem('digital-hub:theme') || 'system';
    } catch {
      return 'system';
    }
  });
  const setThemePref = (value) => {
    setThemePrefState(value);
    try {
      localStorage.setItem('digital-hub:theme', value);
    } catch {
      // ignore
    }
  };
  const [systemDark, setSystemDark] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mq) return undefined;
    setSystemDark(mq.matches);
    const onChange = (e) => setSystemDark(e.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  const dark = themePref === 'dark' || (themePref === 'system' && systemDark);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  }, [dark]);

  const toggleTheme = () => setThemePref(dark ? 'light' : 'dark');

  // ---- Who is signed in and what they can see -----------------------------
  const previewClientId = viewAs.client || clients[0]?.id;
  const previewManagerId = viewAs.manager || team.find((m) => m.role === 'manager')?.id;

  const client =
    role !== 'staff'
      ? null
      : isPreview
        ? clients.find((c) => c.id === previewClientId) || null
        : clients.find((c) => c.id === myClient) || null;

  const currentUser = useMemo(() => {
    const me = {
      id: profile.id,
      name: profile.full_name || profile.email,
      email: profile.email,
      phone: profile.phone || '',
      title: profile.title || '',
      groupId: profile.group_id,
    };
    if (!isPreview) return me;
    if (role === 'manager') return team.find((m) => m.id === previewManagerId) || { id: 'none', name: 'No manager yet', email: '', groupId: null };
    return client ? { id: client.id, name: client.contact, email: client.email, phone: client.phone } : { id: 'none', name: 'No client', email: '' };
  }, [profile, isPreview, role, team, previewManagerId, client]);

  const user = { ...currentUser, role };
  const access = getAccess(role, client, rolePermissions);
  const canEditPage = (pageKey) => rolePermissions[pageKey]?.canEdit === true && (role !== 'staff' || ['profile', 'password', 'settings.appearance'].includes(pageKey));

  const scopedStores = useMemo(() => {
    if (role === 'admin') return stores;
    if (role === 'manager') return stores.filter((s) => s.groupId === currentUser?.groupId);
    return stores.filter((s) => client?.storeIds?.includes(s.id));
  }, [role, stores, currentUser, client]);

  // Managers can narrow their view with the store filter bar.
  const [selectedStores, setSelectedStores] = useState([]);
  const scopedKey = scopedStores.map((s) => s.id).join(',');
  useEffect(() => {
    setSelectedStores(scopedStores.map((s) => s.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, previewManagerId, scopedKey]);

  const storeIds =
    role === 'manager' ? selectedStores.filter((id) => scopedStores.some((s) => s.id === id)) : scopedStores.map((s) => s.id);

  // Customer totals are derived from synced orders.
  const customers = useMemo(
    () =>
      customerRecords.map((c) => {
        const theirs = orders.filter((o) => o.customerId === c.id);
        const counted = theirs.filter((o) => o.status !== 'refunded' && o.status !== 'cancelled');
        return {
          ...c,
          orderCount: theirs.length,
          spent: counted.reduce((sum, o) => sum + (o.total || 0), 0),
          lastOrder: theirs[0]?.placedAt,
        };
      }),
    [customerRecords, orders],
  );

  const storeMap = useMemo(() => Object.fromEntries(stores.map((s) => [s.id, s])), [stores]);
  const customerMap = useMemo(() => Object.fromEntries(customers.map((c) => [c.id, c])), [customers]);
  const storeOf = (id) => storeMap[id];
  const customerOf = (id) => customerMap[id];
  const money = (value) => formatMoney(Number(value) || 0, settings.currency);

  // ---- Navigation ----------------------------------------------------------
  const go = (target, tab) => {
    const next = canVisitPage(target, access, rolePermissions, role) ? target : firstAccessiblePage();
    navigate(routePath(role, next, next === 'settings' ? tab : null));
    setDrawer(null);
    mainRef.current?.scrollTo?.({ top: 0 });
  };

  const firstAccessiblePage = () => {
    const firstItem = NAV_ITEMS.find((item) => canVisitPage(item.key, access, rolePermissions, role));
    if (firstItem) return firstItem.key;
    if (settingsTabsFor(role, rolePermissions).length) return 'settings';
    if (canVisitPage('profile', access, rolePermissions, role)) return 'profile';
    return 'dashboard';
  };

  // Keep the URL valid for whoever is looking.
  useEffect(() => {
    if (!isAdmin && route.env !== realRole) {
      navigate(routePath(realRole), { replace: true });
    } else if (!canVisitPage(page, access, rolePermissions, role)) {
      navigate(routePath(role, firstAccessiblePage()), { replace: true });
    } else if (page === 'settings' && settingsTab && !settingsTabsFor(role, rolePermissions).some((t) => t.key === settingsTab)) {
      const firstTab = settingsTabsFor(role, rolePermissions)[0];
      navigate(firstTab ? routePath(role, 'settings', firstTab.key) : routePath(role, firstAccessiblePage()), { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.env, page, settingsTab, role, access.manageSystem, access.viewCustomers, rolePermissions]);

  useEffect(() => setDrawer(null), [role, viewAs.client]);

  // ---- Activity & notifications ------------------------------------------------
  const log = (text, type) =>
    setActivity((list) => [{ id: uid('a'), at: Date.now(), actor: currentUser.name, actorId: profile.id, type, text }, ...list]).catch(() => {});

  const notify = (text, tone = 'success') =>
    saveRecord('notifications', uid('n'), { at: Date.now(), text, tone, read: false }).catch(() => {});

  const markAllRead = () => setNotifications((list) => list.map((n) => ({ ...n, read: true }))).catch(() => {});

  const askConfirm = (options) => setConfirmDialog(options);
  const closeConfirm = () => setConfirmDialog(null);
  const openDrawer = (type, id) => setDrawer({ type, id });
  const closeDrawer = () => setDrawer(null);

  const stamp = () => ({ syncState: 'pending', syncError: null, updatedBy: profile.id, editedAt: Date.now() });

  // Tells the user how the store answered.
  const reportSync = async (collectionName, id, { title, success, store }) => {
    if (store?.sample) return showToast({ title: success, body: `${store.name} is a sample store, so nothing was sent.` });
    if (store?.status === 'paused') return showToast({ title: 'Saved. Waiting to sync', body: `${store.name} is paused. The change goes out when it resumes.` });
    if (store && store.platform !== 'WooCommerce') {
      return showToast({ title: 'Saved in Digital Hub', body: `Live sync for ${store.platform} isn’t available yet, so ${store.name} wasn’t changed.` });
    }
    showToast({ pending: true, title, body: store?.name });
    const result = await waitForSync(collectionName, id);
    if (result.state === 'synced' || result.state === 'gone') return showToast({ title: success, body: store?.name });
    if (result.state === 'timeout') return showToast({ title: 'Still sending…', body: 'The store is slow to answer. The row updates when it does.' });
    return showToast({ tone: 'danger', title: 'The store didn’t accept the change', body: result.error });
  };

  // ---- Products & orders ---------------------------------------------------
  const saveProduct = async (product, previous) => {
    const store = storeOf(product.storeId);
    const isNew = !previous;
    const record = isNew ? { ...product, id: uid('p'), externalId: 'pending', ...stamp() } : { ...product, ...stamp() };
    const changes = diffFields(previous, record, ['title', 'sku', 'category', 'price', 'stock', 'status']);
    if (!isNew && !Object.keys(changes).length) return showToast({ title: 'No changes to save' });

    try {
      await setProducts((list) => (isNew ? [record, ...list] : list.map((p) => (p.id === record.id ? record : p))));
    } catch {
      return undefined; // reportWriteError already showed why
    }
    log(`${isNew ? 'Added' : 'Updated'} ${record.title} in ${store.name}`, 'product');
    if (role === 'staff' && settings.notify.clientActivity) notify(`${client?.company} ${isNew ? 'added' : 'updated'} ${record.title}`, 'success');
    if (record.stock != null && record.stock < settings.lowStockThreshold && (isNew || previous.stock == null || previous.stock >= settings.lowStockThreshold) && settings.notify.lowStock) {
      notify(`${record.title} is low on stock (${record.stock} left).`, 'warning');
    }
    return reportSync('products', record.id, {
      title: `Sending to ${store.platform}…`,
      success: `${record.title} ${isNew ? 'created' : 'updated'} in ${store.platform}`,
      store,
    });
  };

  const deleteProduct = async (product) => {
    const store = storeOf(product.storeId);
    try {
      await setProducts((list) => list.filter((p) => p.id !== product.id));
    } catch {
      return undefined;
    }
    log(`Deleted ${product.title} from ${store.name}`, 'product');
    return reportSync('products', product.id, { title: `Deleting in ${store.platform}…`, success: `${product.title} deleted`, store });
  };

  const updateOrderStatus = async (order, status) => {
    const store = storeOf(order.storeId);
    const label = STATUS[status][0].toLowerCase();
    try {
      await setOrders((list) => list.map((o) => (o.id === order.id ? { ...o, status, ...stamp() } : o)));
    } catch {
      return undefined;
    }
    log(`Marked order ${order.number} as ${label}`, 'order');
    return reportSync('orders', order.id, { title: `Updating order in ${store.platform}…`, success: `Order ${order.number} is now ${label}`, store });
  };

  // ---- Integrations --------------------------------------------------------
  const resyncStore = async (store, { quiet } = {}) => {
    if (store.status === 'paused') return;
    if (store.platform !== 'WooCommerce' || store.sample) {
      if (!quiet) showToast({ title: store.sample ? `${store.name} is a sample store` : `Live sync for ${store.platform} isn’t available yet` });
      return;
    }
    setSyncingStores((s) => ({ ...s, [store.id]: true }));
    if (!quiet) showToast({ pending: true, title: `Syncing ${store.name}…`, body: 'Importing products, orders and customers.' });
    try {
      const result = await call('syncStore', { storeId: store.id });
      if (result.ok) {
        const c = result.counts;
        showToast({
          title: `${store.name} is up to date`,
          body: [c && `${c.products} products, ${c.orders} orders, ${c.customers} customers.`, result.message].filter(Boolean).join(' '),
        });
      } else {
        showToast({ tone: 'danger', title: `${store.name} didn’t sync`, body: result.message });
        if (settings.notify.syncFailed) notify(`Sync failed for ${store.name}: ${result.message}`, 'danger');
      }
    } catch (err) {
      showToast({ tone: 'danger', title: `${store.name} didn’t sync`, body: callError(err) });
    } finally {
      setSyncingStores((s) => withoutKey(s, store.id));
    }
  };

  // Store credentials are server-side Netlify environment variables, never browser form data.
  const testConnection = async (form) => {
    if (form.platform !== 'WooCommerce') {
      return { ok: false, message: `Live connection for ${form.platform} isn’t available yet. Only WooCommerce connects for now.` };
    }
    try {
      return await call('testWooConnection', {
        storeId: form.storeId,
      });
    } catch (err) {
      return { ok: false, message: callError(err) };
    }
  };

  const startOAuth = async () => {
    throw new Error('Marketplace sign-in isn’t available yet.');
  };

  const reauthorizeStore = (store) =>
    showToast({ title: `Live connection for ${store.platform} isn’t available yet`, body: 'Only WooCommerce stores sync for now.' });

  const setStoreClients = (store, clientIds) => {
    setClients((list) =>
      list.map((c) => {
        const had = (c.storeIds || []).includes(store.id);
        const has = clientIds.includes(c.id);
        if (had === has) return c;
        return { ...c, storeIds: has ? [...(c.storeIds || []), store.id] : c.storeIds.filter((id) => id !== store.id) };
      }),
    ).catch(() => {});
    log(`Updated client access for ${store.name}`, 'client');
    showToast({ title: 'Client access saved', body: `${clientIds.length} client${clientIds.length === 1 ? '' : 's'} can see ${store.name}.` });
  };

  /**
  * WooCommerce credentials are configured in Netlify and indexed by the generated recordKey.
   */
  const saveStore = async (store, isNew, clientId) => {
    const data = store;
    const id = isNew ? uid('st') : data.id;
    const previous = storeOf(id);
    const isWoo = data.platform === 'WooCommerce';
    const urlChanged = !isNew && previous?.url !== data.url;
    const record = {
      ...previous,
      ...data,
      id,
      health: isWoo ? (isNew || urlChanged ? 'checking' : previous?.health || 'checking') : 'manual',
      lastSync: previous?.lastSync || null,
      createdAt: previous?.createdAt || Date.now(),
    };

    try {
      await setStores((list) => (isNew ? [...list, record] : list.map((s) => (s.id === id ? record : s))));
      if (clientId) await setClients((list) => list.map((c) => (c.id === clientId ? { ...c, storeIds: [...(c.storeIds || []), id] } : c)));
    } catch {
      return;
    }

    log(`${isNew ? 'Connected' : 'Updated'} ${record.platform} store ${record.name}`, 'integration');
    if (isWoo && (isNew || urlChanged) && record.status === 'active') {
      resyncStore(record);
    } else {
      showToast({
        title: `${record.name} saved`,
        body: isWoo ? undefined : `Live sync for ${record.platform} isn’t available yet. The store is saved so you can organize clients.`,
      });
    }
  };

  const toggleStorePause = (store) => {
    const status = store.status === 'paused' ? 'active' : 'paused';
    setStores((list) => list.map((s) => (s.id === store.id ? { ...s, status } : s))).catch(() => {});
    log(`${status === 'paused' ? 'Paused' : 'Resumed'} syncing for ${store.name}`, 'integration');
    if (status === 'active') resyncStore({ ...store, status });
    else showToast({ title: `${store.name} paused`, body: 'Edits are saved and sent when you resume.' });
  };

  // Removes the webhooks and Digital Hub's copy of the data. Nothing is deleted in the store.
  const deleteStore = async (store) => {
    showToast({ pending: true, title: `Disconnecting ${store.name}…` });
    try {
      try {
        await call('disconnectStore', { storeId: store.id });
      } catch (err) {
        if (err?.status !== 404 && !['functions/not-found', 'functions/internal', 'functions/unavailable'].includes(err?.code)) throw err;
        await removeStoreData(store.id); // sync functions not deployed: remove Digital Hub's copy directly
      }
      log(`Deleted integration ${store.name}`, 'integration');
      showToast({ title: `${store.name} disconnected` });
    } catch (err) {
      showToast({ tone: 'danger', title: 'Couldn’t disconnect', body: callError(err) });
    }
  };

  // ---- Clients -------------------------------------------------------------
  const saveClient = (input, isNew, accessDiff) => {
    const { sendInvite, ...data } = input;
    if (isNew) {
      const record = { ...data, id: uid('cl'), status: 'invited', createdAt: Date.now() };
      setClients((list) => [record, ...list]).catch(() => {});
      log(`Created client ${record.company} with access to ${record.storeIds.length} store(s)`, 'client');
      showToast({
        title: `${record.company} created`,
        body: 'Next: in Settings → Users & roles, add a user for them and link it to this client.',
      });
      return;
    }
    setClients((list) => list.map((c) => (c.id === data.id ? { ...c, ...data } : c))).catch(() => {});
    if (accessDiff) {
      log(`Changed store access for ${data.company} (+${accessDiff.added} / −${accessDiff.removed})`, 'client');
      showToast({
        title: 'Store access updated',
        body: `${data.company}: ${accessDiff.added} granted, ${accessDiff.removed} revoked. ${data.storeIds.length} store${data.storeIds.length === 1 ? '' : 's'} total.`,
      });
    } else {
      log(`Updated details for ${data.company}`, 'client');
      showToast({ title: 'Client saved', body: data.company });
    }
  };

  const deleteClient = (target) => {
    setClients((list) => list.filter((c) => c.id !== target.id)).catch(() => {});
    if (viewAs.client === target.id) setViewAs((v) => ({ ...v, client: '' }));
    log(`Deleted client ${target.company}`, 'client');
    showToast({ title: `${target.company} deleted` });
  };

  const setClientStatus = (target, status) => {
    setClients((list) => list.map((c) => (c.id === target.id ? { ...c, status } : c))).catch(() => {});
    log(`${status === 'suspended' ? 'Suspended' : 'Reactivated'} ${target.company}`, 'client');
    showToast({ title: status === 'suspended' ? `${target.company} suspended` : `${target.company} reactivated` });
  };

  const resendInvite = (target) =>
    showToast({ title: 'Share the sign-in details', body: `Give ${target.email} the temporary password you set in Settings → Users & roles.` });

  const viewAsClient = (clientId) => {
    setViewAs((v) => ({ ...v, client: clientId }));
    setRole('client');
  };

  // ---- Groups, settings, profile ---------------------------------------------
  const saveGroup = (group, storeIdsInGroup, isNew) => {
    const id = isNew ? uid('g') : group.id;
    setGroups((list) => (isNew ? [...list, { ...group, id, storeIds: [] }] : list.map((g) => (g.id === id ? { ...g, ...group } : g)))).catch(() => {});
    // The server keeps each group's storeIds in step with the stores' groupId.
    setStores((list) => list.map((s) => (storeIdsInGroup.includes(s.id) ? { ...s, groupId: id } : s))).catch(() => {});
    log(`${isNew ? 'Created' : 'Updated'} store group ${group.name}`, 'settings');
    showToast({ title: `Group “${group.name}” saved` });
  };

  const deleteGroup = (group) => {
    setGroups((list) => list.filter((g) => g.id !== group.id)).catch(() => {});
    log(`Deleted store group ${group.name}`, 'settings');
    showToast({ title: `Group “${group.name}” deleted` });
  };

  const updateSettings = (patch, message) => {
    updateSettingsDoc(patch).catch(() => {});
    if (message) {
      showToast({ title: message });
      log(message, 'settings');
    }
  };

  const updateProfile = async (next) => {
    if (isPreview && role === 'staff' && client) {
      setClients((list) => list.map((c) => (c.id === client.id ? { ...c, contact: next.name, email: next.email, phone: next.phone } : c))).catch(() => {});
      return showToast({ title: 'Client contact saved', body: client.company });
    }
    if (isPreview) return showToast({ title: 'Switch back to the admin dashboard to edit your own profile' });
    try {
      const result = await updateOwnProfile(profile.id, { full_name: next.name, phone: next.phone, email: next.email });
      setProfile((p) => ({ ...p, full_name: next.name, phone: next.phone }));
      return showToast({
        title: 'Profile saved',
        body: result.emailPending ? `We sent a link to ${next.email}. Your sign-in email changes after you open it.` : undefined,
      });
    } catch (err) {
      return showToast({ tone: 'danger', title: 'Couldn’t save profile', body: authMessage(err) });
    }
  };

  // ---- Workspace data ----------------------------------------------------------
  const exportBackup = () => {
    const blob = workspaceToFile({ stores, groups, products, orders, customers: customerRecords, clients, settings, activity, notifications });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `digital-hub-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast({ title: 'Backup downloaded' });
  };

  const hasSampleData = stores.some((s) => s.sample);

  const loadSampleData = async () => {
    showToast({ pending: true, title: 'Adding sample stores…' });
    try {
      await seedSampleData();
      log('Added the sample stores', 'settings');
      showToast({ title: 'Sample stores added', body: 'They’re marked as samples and never contact a real store.' });
    } catch (err) {
      showToast({ tone: 'danger', title: 'Couldn’t add sample data', body: err.message });
    }
  };

  const removeSampleData = async () => {
    showToast({ pending: true, title: 'Removing sample stores…' });
    try {
      await clearSampleData();
      log('Removed the sample stores', 'settings');
      showToast({ title: 'Sample stores removed' });
    } catch (err) {
      showToast({ tone: 'danger', title: 'Couldn’t remove sample data', body: err.message });
    }
  };

  const signOut = async () => {
    await appSignOut();
    window.location.assign('/signin?message=signed-out');
  };

  const value = {
    // identity
    profile, realRole, isAdmin, isPreview,
    role, setRole, viewAs, setViewAs, user, client, access, rolePermissions, canEditPage, signOut,
    // records
    stores, groups, scopedStores, storeIds, selectedStores, setSelectedStores, storeOf, customerOf,
    products, orders, customers, clients, team, users, settings, activity, notifications, sessions, setSessions,
    // navigation & ui
    page, settingsTab, go, mainRef, search, setSearch, q: search.trim().toLowerCase(),
    dark, themePref, setThemePref, toggleTheme, money,
    syncing, syncingStores, toast, showToast, dismissToast, log, markAllRead,
    confirmDialog, askConfirm, closeConfirm, drawer, openDrawer, closeDrawer,
    // actions
    saveProduct, deleteProduct, updateOrderStatus,
    resyncStore, testConnection, saveStore, startOAuth, reauthorizeStore, setStoreClients, toggleStorePause, deleteStore,
    saveClient, deleteClient, setClientStatus, resendInvite, viewAsClient,
    saveGroup, deleteGroup, updateSettings, updateProfile,
    exportBackup, hasSampleData, loadSampleData, removeSampleData,
    isOAuthPlatform, PLATFORMS,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
