import { minutesAgo } from './constants';

export const groups = [
  { id: 'g_east', name: 'East' },
  { id: 'g_west', name: 'West' },
  { id: 'g_central', name: 'Central' },
  { id: 'g_market', name: 'Marketplaces' },
];

export const stores = [
  { id: 'st_01', name: 'Northwind Outdoor', platform: 'Shopify', url: 'northwind-outdoor.myshopify.com', keyHint: 'shpat_••••a91c', groupId: 'g_east', status: 'active', health: 'connected', lastSync: minutesAgo(2) },
  { id: 'st_02', name: 'Harbor Coffee Co.', platform: 'WooCommerce', url: 'https://harborcoffee.example', keyHint: 'ck_••••7f2e', groupId: 'g_east', status: 'active', health: 'connected', lastSync: minutesAgo(5) },
  { id: 'st_03', name: 'Pine & Thread', platform: 'Shopify', url: 'pine-and-thread.myshopify.com', keyHint: 'shpat_••••03bd', groupId: 'g_east', status: 'active', health: 'slow', lastSync: minutesAgo(48) },
  { id: 'st_04', name: 'Desert Bloom Home', platform: 'WooCommerce', url: 'https://desertbloom.example', keyHint: 'ck_••••c410', groupId: 'g_west', status: 'active', health: 'connected', lastSync: minutesAgo(1) },
  { id: 'st_05', name: 'Copperline Audio', platform: 'Shopify', url: 'copperline-audio.myshopify.com', keyHint: 'shpat_••••9e77', groupId: 'g_west', status: 'active', health: 'error', lastSync: minutesAgo(360) },
  { id: 'st_06', name: 'Little Fern Kids', platform: 'WooCommerce', url: 'https://littlefern.example', keyHint: 'ck_••••15aa', groupId: 'g_central', status: 'paused', health: 'connected', lastSync: minutesAgo(1440) },
  { id: 'st_07', name: 'Summit Gear Direct', platform: 'Amazon', url: 'sellercentral.amazon.com', accountId: 'A2X9K4LQ7TZ1PM', region: 'North America', keyHint: 'OAuth · renews automatically', groupId: 'g_market', status: 'active', health: 'connected', lastSync: minutesAgo(3) },
  { id: 'st_08', name: 'Vintage Vault Finds', platform: 'eBay', url: 'ebay.com/str/vintagevault', accountId: 'vintage_vault_finds', region: 'United States', keyHint: 'OAuth · expires in 6 days', groupId: 'g_market', status: 'active', health: 'expiring', lastSync: minutesAgo(9) },
  { id: 'st_09', name: 'Glow Theory Beauty', platform: 'TikTok Shop', url: 'seller-us.tiktok.com', accountId: '7495012883610231', region: 'United States', keyHint: 'OAuth · renews automatically', groupId: 'g_market', status: 'active', health: 'connected', lastSync: minutesAgo(4) },
  { id: 'st_10', name: 'Northwind on Amazon', platform: 'Amazon', url: 'sellercentral.amazon.com', accountId: 'A1NWD83HQ02KXY', region: 'North America', keyHint: 'OAuth · renews automatically', groupId: 'g_east', status: 'active', health: 'connected', lastSync: minutesAgo(11) },
];
