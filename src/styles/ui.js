// Shared Tailwind class tokens, copied verbatim from the prototype.
export const ui = {
  card: 'rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900',
  input:
    'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 disabled:bg-gray-50 disabled:text-gray-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:placeholder:text-gray-500 dark:disabled:bg-gray-900',
  label: 'mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300',
  btn: 'inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50',
  primary: 'bg-teal-700 text-white hover:bg-teal-800 dark:bg-teal-500 dark:text-gray-950 dark:hover:bg-teal-400',
  secondary: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800',
  danger: 'bg-red-700 text-white hover:bg-red-800 dark:bg-red-600 dark:hover:bg-red-500',
  sm: 'px-2.5 py-1 text-xs',
  icon: 'rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100',
  h: 'text-gray-900 dark:text-gray-100',
  body: 'text-gray-700 dark:text-gray-300',
  muted: 'text-gray-500 dark:text-gray-400',
  line: 'border-gray-100 dark:border-gray-800',
  divide: 'divide-y divide-gray-100 dark:divide-gray-800',
  hover: 'hover:bg-gray-50 dark:hover:bg-gray-800/60',
};

export const btn = (variant = 'secondary', extra = '') => `${ui.btn} ${ui[variant]} ${extra}`;

export const TONES = {
  success: 'border-teal-200 bg-teal-50 text-teal-800 dark:border-teal-500/30 dark:bg-teal-500/10 dark:text-teal-300',
  warning: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300',
  danger: 'border-red-200 bg-red-50 text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300',
  info: 'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300',
  neutral: 'border-gray-200 bg-gray-100 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

// status key -> [label, tone]
export const STATUS = {
  active: ['Active', 'success'],
  draft: ['Draft', 'neutral'],
  out_of_stock: ['Out of stock', 'warning'],
  fulfilled: ['Fulfilled', 'success'],
  processing: ['Processing', 'info'],
  unfulfilled: ['Unfulfilled', 'warning'],
  refunded: ['Refunded', 'neutral'],
  cancelled: ['Cancelled', 'neutral'],
  connected: ['Connected', 'success'],
  slow: ['Slow responses', 'warning'],
  error: ['Not responding', 'danger'],
  paused: ['Paused', 'neutral'],
  checking: ['Checking…', 'info'],
  manual: ['Not synced', 'neutral'],
  expiring: ['Reauthorize soon', 'warning'],
  invited: ['Invite pending', 'info'],
  suspended: ['Suspended', 'danger'],
};

export const ORDER_STATUSES = ['unfulfilled', 'processing', 'fulfilled', 'refunded', 'cancelled'];
