export const defaultSettings = {
  workspaceName: 'Digital Hub',
  supportEmail: 'support@digitalhub.app',
  currency: 'USD',
  timezone: 'America/New_York',
  dateFormat: 'MMM d, yyyy',
  lowStockThreshold: 10,
  syncFrequency: '15',
  conflictRule: 'latest',
  syncFields: { title: true, price: true, stock: true, status: true },
  autoRetry: true,
  webhookUrl: 'https://hooks.digitalhub.app/sync',
  notify: { newOrder: true, lowStock: true, syncFailed: true, weeklySummary: false, clientActivity: true },
  twoFactor: false,
};

export const sessions = [
  { id: 'se_1', device: 'Chrome on macOS', place: 'New York, US', last: 'Active now', current: true, icon: 'desktop' },
  { id: 'se_2', device: 'Safari on iPhone', place: 'New York, US', last: '2 hours ago', icon: 'mobile' },
  { id: 'se_3', device: 'Edge on Windows', place: 'Newark, US', last: '3 days ago', icon: 'desktop' },
];
