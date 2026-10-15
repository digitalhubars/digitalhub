import PocketBase from 'pocketbase';

const { PB_URL, PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD } = process.env;

if (!PB_URL || !PB_ADMIN_EMAIL || !PB_ADMIN_PASSWORD) {
  console.error('Set PB_URL, PB_ADMIN_EMAIL, and PB_ADMIN_PASSWORD in the environment before running this script.');
  process.exit(1);
}

const pb = new PocketBase(PB_URL);
const adminAuth = await pb.collection('_superusers').authWithPassword(PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD);
if (!adminAuth?.token) throw new Error('PocketBase superuser authentication did not return a token.');

const text = (name, extra = {}) => ({ type: 'text', name, required: false, min: 0, max: 0, pattern: '', ...extra });
const number = (name) => ({ type: 'number', name, required: false, min: null, max: null });
const bool = (name) => ({ type: 'bool', name, required: false });
const json = (name) => ({ type: 'json', name, required: false, maxSize: 2000000 });
const select = (name, values, required = false) => ({ type: 'select', name, required, maxSelect: 1, values });
const date = (name) => ({ type: 'date', name, required: false, min: '', max: '' });

const userRules = {
  authRule: 'status = "active"',
  listRule: '@request.auth.id != "" && (@request.auth.role = "admin" || id = @request.auth.id)',
  viewRule: '@request.auth.id != "" && (@request.auth.role = "admin" || id = @request.auth.id)',
  createRule: '@request.body.role:isset = false',
  updateRule: '@request.auth.id != "" && (@request.auth.role = "admin" || (id = @request.auth.id && @request.body.role = role && @request.body.group_id = group_id && @request.body.client_id = client_id && @request.body.status = status))',
  deleteRule: '@request.auth.role = "admin"',
};

const loggedIn = '@request.auth.id != "" && @request.auth.role != "" && @request.auth.status = "active"';
const admin = '@request.auth.id != "" && @request.auth.role = "admin" && @request.auth.status = "active"';
const adminOrManager = `${loggedIn} && (@request.auth.role = "admin" || @request.auth.role = "manager")`;

const pageKeys = [
  'dashboard', 'products', 'orders', 'customers', 'clients', 'integrations', 'settings',
  'settings.general', 'settings.users', 'settings.clients', 'settings.groups', 'settings.sync',
  'settings.api', 'settings.access', 'settings.notifications', 'settings.appearance',
  'settings.security', 'settings.activity', 'settings.support', 'profile', 'password', 'role-access',
];

const staffPages = new Set([
  'dashboard', 'products', 'orders', 'customers', 'settings', 'settings.access',
  'settings.notifications', 'settings.appearance', 'settings.security', 'settings.support',
  'profile', 'password',
]);
const managerRestrictedPages = new Set([
  'clients', 'integrations', 'role-access', 'settings.general', 'settings.users', 'settings.clients',
  'settings.groups', 'settings.sync', 'settings.api', 'settings.activity',
]);

function defaultPermission(role, page) {
  if (role === 'admin') return { canView: true, canEdit: true, canDelete: true };
  if (role === 'manager') {
    if (managerRestrictedPages.has(page)) return { canView: false, canEdit: false, canDelete: false };
    if (page.startsWith('settings.') && !['settings.access', 'settings.notifications', 'settings.appearance', 'settings.security', 'settings.support'].includes(page)) {
      return { canView: false, canEdit: false, canDelete: false };
    }
    return { canView: true, canEdit: true, canDelete: false };
  }
  return { canView: staffPages.has(page), canEdit: false, canDelete: false };
}

const collectionSpecs = [
  {
    name: 'users', type: 'auth', fields: [
      text('full_name'), text('phone'), text('title'), select('role', ['admin', 'manager', 'staff']),
      text('group_id'), text('client_id'), select('status', ['active', 'suspended']), date('created_at'),
    ], rules: userRules,
  },
  {
    name: 'role_access', type: 'base', fields: [
      select('role', ['admin', 'manager', 'staff'], true), text('page', { required: true }),
      bool('canView'), bool('canEdit'), bool('canDelete'),
    ], rules: {
      listRule: '@request.auth.id != ""', viewRule: '@request.auth.id != ""',
      createRule: admin, updateRule: admin, deleteRule: admin,
    },
  },
  {
    name: 'workspace', type: 'base', fields: [
      text('recordKey', { required: true, unique: true }), text('workspaceName'), text('supportEmail'), text('currency'),
      text('timezone'), text('dateFormat'), number('lowStockThreshold'), text('syncFrequency'), text('conflictRule'),
      json('syncFields'), bool('autoRetry'), text('webhookUrl'), json('notify'), bool('twoFactor'),
    ], rules: { listRule: loggedIn, viewRule: loggedIn, createRule: adminOrManager, updateRule: adminOrManager, deleteRule: admin },
  },
  {
    name: 'groups', type: 'base', fields: [
      text('recordKey', { required: true, unique: true }), text('name'), json('storeIds'), bool('sample'),
    ], rules: { listRule: loggedIn, viewRule: loggedIn, createRule: adminOrManager, updateRule: adminOrManager, deleteRule: admin },
  },
  {
    name: 'clients', type: 'base', fields: [
      text('recordKey', { required: true, unique: true }), text('company'), text('contact'), text('email'), text('phone'),
      select('status', ['active', 'invited', 'suspended']), json('storeIds'), json('permissions'), number('createdAt'), bool('sample'),
    ], rules: { listRule: loggedIn, viewRule: loggedIn, createRule: adminOrManager, updateRule: adminOrManager, deleteRule: admin },
  },
  {
    name: 'stores', type: 'base', fields: [
      text('recordKey', { required: true, unique: true }), text('name'), select('platform', ['Shopify', 'WooCommerce', 'Amazon', 'eBay', 'TikTok Shop']),
      text('url'), text('groupId'), select('status', ['active', 'paused']),
      select('health', ['checking', 'connected', 'slow', 'error', 'expiring', 'manual']),
      number('lastSync'), text('keyHint'), text('accountId'), text('region'), text('syncFrequency'), text('webhooks'),
      number('createdAt'), bool('sample'),
    ], rules: { listRule: loggedIn, viewRule: loggedIn, createRule: adminOrManager, updateRule: adminOrManager, deleteRule: admin },
  },
  {
    name: 'products', type: 'base', fields: [
      text('recordKey', { required: true, unique: true }), text('storeId'), text('title'), text('category'), number('price'), number('stock'),
      text('sku'), text('externalId'), select('status', ['active', 'draft', 'out_of_stock']), text('syncState'),
      text('syncError'), bool('pendingDelete'), text('updatedBy'), number('editedAt'), bool('sample'),
    ], rules: { listRule: loggedIn, viewRule: loggedIn, createRule: adminOrManager, updateRule: adminOrManager, deleteRule: admin },
  },
  {
    name: 'orders', type: 'base', fields: [
      text('recordKey', { required: true, unique: true }), text('number'), text('storeId'), text('customerId'), json('items'),
      number('subtotal'), number('shipping'), number('total'), text('status'), number('placedAt'), text('syncState'),
      text('syncError'), text('updatedBy'), number('editedAt'), bool('sample'),
    ], rules: { listRule: loggedIn, viewRule: loggedIn, createRule: adminOrManager, updateRule: adminOrManager, deleteRule: admin },
  },
  {
    name: 'customers', type: 'base', fields: [
      text('recordKey', { required: true, unique: true }), text('storeId'), text('name'), text('email'), number('orderCount'), number('spent'), bool('sample'),
    ], rules: { listRule: loggedIn, viewRule: loggedIn, createRule: adminOrManager, updateRule: adminOrManager, deleteRule: admin },
  },
  {
    name: 'activity', type: 'base', fields: [
      text('recordKey', { required: true, unique: true }), number('at'), text('actor'), text('actorId'), text('type'), text('text'),
    ], rules: { listRule: loggedIn, viewRule: loggedIn, createRule: adminOrManager, updateRule: adminOrManager, deleteRule: admin },
  },
  {
    name: 'notifications', type: 'base', fields: [
      text('recordKey', { required: true, unique: true }), number('at'), text('text'), text('tone'), bool('read'),
    ], rules: { listRule: loggedIn, viewRule: loggedIn, createRule: adminOrManager, updateRule: adminOrManager, deleteRule: admin },
  },
  {
    name: 'storeSecrets', type: 'base', fields: [
      text('recordKey', { required: true, unique: true }), text('url'), text('token'), text('consumerKey'), text('consumerSecret'), number('updatedAt'),
    ], rules: { listRule: admin, viewRule: admin, createRule: admin, updateRule: admin, deleteRule: admin },
  },
];

const summary = { created: [], updated: [], unchanged: [], migratedClientRoles: 0, repairedUserStatuses: 0, permissionsCreated: 0, permissionsUpdated: 0, emptyPermissionsRepaired: 0 };
const collectionApi = pb.collections;

async function findCollection(name) {
  try {
    return await collectionApi.getFirstListItem(pb.filter('name = {:name}', { name }));
  } catch (error) {
    if (error?.status === 404) return null;
    throw error;
  }
}

for (const spec of collectionSpecs) {
  const existing = await findCollection(spec.name);
  if (existing && existing.type !== spec.type) {
    throw new Error(`Collection "${spec.name}" exists as type "${existing.type}"; expected "${spec.type}". Convert it manually without deleting its data.`);
  }

  const currentFields = existing?.fields || [];
  const fields = [...currentFields];
  for (const definition of spec.fields) {
    const index = fields.findIndex((field) => field.name === definition.name);
    if (index === -1) fields.push(definition);
    else fields[index] = { ...fields[index], ...definition };
  }

  const payload = { name: spec.name, type: spec.type, fields, ...spec.rules };
  if (existing) {
    const existingFields = new Map(currentFields.map((field) => [field.name, field]));
    const fieldsChanged = spec.fields.some((definition) => {
      const current = existingFields.get(definition.name);
      return !current || Object.entries(definition).some(([key, value]) => JSON.stringify(current[key]) !== JSON.stringify(value));
    });
    const rulesChanged = Object.entries(spec.rules).some(([key, value]) => existing[key] !== value);
    const changed = fieldsChanged || rulesChanged;
    if (changed) {
      await collectionApi.update(existing.id, payload);
      summary.updated.push(spec.name);
    } else {
      summary.unchanged.push(spec.name);
    }
  } else {
    await collectionApi.create(payload);
    summary.created.push(spec.name);
  }
}

const usersApi = pb.collection('users');
const existingUsers = await usersApi.getFullList();
for (const user of existingUsers) {
  const patch = {};
  if (user.role === 'client') {
    patch.role = 'staff';
    summary.migratedClientRoles += 1;
  }
  if (!user.status) {
    patch.status = 'active';
    summary.repairedUserStatuses += 1;
  }
  if (Object.keys(patch).length) await usersApi.update(user.id, patch);
}

const roleAccessApi = pb.collection('role_access');
const permissionRecords = await roleAccessApi.getFullList();
const unusedEmptyRecords = permissionRecords.filter((record) => !record.role && !record.page);

for (const role of ['admin', 'manager', 'staff']) {
  for (const page of pageKeys) {
    const permission = defaultPermission(role, page);
    let existing = permissionRecords.find((record) => record.role === role && record.page === page);
    let reusedEmptyRecord = false;

    if (!existing && unusedEmptyRecords.length) {
      existing = unusedEmptyRecords.shift();
      reusedEmptyRecord = true;
    }

    const effectivePermission = !existing || role === 'admin'
      ? permission
      : role === 'manager'
        ? {
          canView: typeof existing.canView === 'boolean' ? existing.canView : permission.canView,
          canEdit: typeof existing.canEdit === 'boolean' ? existing.canEdit : permission.canEdit,
          canDelete: false,
        }
        : {
          canView: typeof existing.canView === 'boolean' ? existing.canView : permission.canView,
          canEdit: false,
          canDelete: false,
        };
    const data = { role, page, ...effectivePermission };
    if (existing) {
      const changed = ['canView', 'canEdit', 'canDelete'].some((key) => existing[key] !== effectivePermission[key]);
      if (changed) {
        await roleAccessApi.update(existing.id, data);
        summary.permissionsUpdated += 1;
      } else if (reusedEmptyRecord) {
        await roleAccessApi.update(existing.id, data);
        summary.permissionsUpdated += 1;
      }
      if (reusedEmptyRecord) summary.emptyPermissionsRepaired += 1;
      if (reusedEmptyRecord) permissionRecords.push({ ...existing, ...data });
    } else {
      const created = await roleAccessApi.create(data);
      permissionRecords.push(created);
      summary.permissionsCreated += 1;
    }
  }
}

console.log('PocketBase setup complete.');
console.log(`Collections created (${summary.created.length}): ${summary.created.join(', ') || 'none'}`);
console.log(`Collections repaired (${summary.updated.length}): ${summary.updated.join(', ') || 'none'}`);
console.log(`Collections unchanged (${summary.unchanged.length}): ${summary.unchanged.join(', ') || 'none'}`);
console.log(`Legacy client roles migrated to staff: ${summary.migratedClientRoles}`);
console.log(`User statuses repaired to active: ${summary.repairedUserStatuses}`);
console.log(`Role permissions created: ${summary.permissionsCreated}`);
console.log(`Role permissions updated: ${summary.permissionsUpdated}`);
console.log(`Empty role_access records repaired: ${summary.emptyPermissionsRepaired}`);
console.log('No collections or records were deleted.');
