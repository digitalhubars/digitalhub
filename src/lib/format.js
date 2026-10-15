export const uid = (prefix) => `${prefix}_${Math.random().toString(36).slice(2, 8)}`;

export const formatMoney = (value, currency = 'USD') =>
  value.toLocaleString('en-US', { style: 'currency', currency });

export const formatDate = (ts) =>
  new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export const formatDateTime = (ts) =>
  new Date(ts).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

export const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export const initials = (name) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

export function timeAgo(ts) {
  const minutes = Math.max(0, Math.round((Date.now() - ts) / 6e4));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

export function formatLastSync(ts) {
  const timestamp = Number(ts);
  return Number.isFinite(timestamp) && timestamp > 0 ? timeAgo(timestamp) : 'Never synced';
}

export function downloadCsv(filename, rows) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const quote = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [headers.join(','), ...rows.map((row) => headers.map((h) => quote(row[h])).join(','))].join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Field-level diff used for sync payloads: { field: { from, to } } on edit, { field: value } on create.
export function diffFields(previous, next, fields) {
  const changes = {};
  fields.forEach((field) => {
    if (!previous || previous[field] !== next[field]) {
      changes[field] = previous ? { from: previous[field], to: next[field] } : next[field];
    }
  });
  return changes;
}

export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
