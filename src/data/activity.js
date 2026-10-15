import { minutesAgo } from './constants';

export const activity = [
  { id: 'a_4', at: minutesAgo(20), actor: 'Ivy Brooks', type: 'integration', text: 'eBay authorization for Vintage Vault Finds expires in 6 days' },
  { id: 'a_3', at: minutesAgo(35), actor: 'Dana Lopez', type: 'integration', text: 'Copperline Audio stopped responding to API calls' },
  { id: 'a_2', at: minutesAgo(1560), actor: 'Dana Lopez', type: 'client', text: 'Invited Copperline Audio (Mei Lin)' },
  { id: 'a_1', at: minutesAgo(1800), actor: 'Sam Reyes', type: 'product', text: 'Updated stock for Merino Base Layer' },
];

// A function so timestamps are taken when the app mounts.
export const createInitialNotifications = () => [
  { id: 'n_1', at: minutesAgo(35), text: 'Copperline Audio is not responding. Check its API key.', tone: 'danger', read: false },
  { id: 'n_2', at: minutesAgo(50), text: 'Pine & Thread is responding slowly.', tone: 'warning', read: false },
  { id: 'n_3', at: minutesAgo(180), text: 'Wooden Stacking Rings is low on stock (3 left).', tone: 'warning', read: true },
];
