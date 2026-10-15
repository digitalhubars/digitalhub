export const PLATFORMS = {
  Shopify: {
    api: 'Shopify Admin API',
    auth: 'key',
    idLabel: 'Product GID',
    tone: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300',
    dot: 'bg-emerald-600 dark:bg-emerald-400',
  },
  WooCommerce: {
    api: 'WooCommerce REST API',
    auth: 'key',
    idLabel: 'Product ID',
    tone: 'border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300',
    dot: 'bg-violet-600 dark:bg-violet-400',
  },
  Amazon: {
    api: 'Amazon SP-API',
    auth: 'oauth',
    idLabel: 'ASIN',
    account: 'Seller ID',
    portal: 'Amazon Seller Central',
    connectLabel: 'Login with Amazon Seller Central',
    button: 'bg-[#FF9900] text-gray-950 hover:bg-[#F08C00]',
    regions: ['North America', 'Europe', 'Far East'],
    scopes: ['Listings & inventory', 'Pricing', 'Orders (read)', 'Fulfillment status'],
    tone: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300',
    dot: 'bg-amber-500 dark:bg-amber-400',
  },
  eBay: {
    api: 'eBay Sell API',
    auth: 'oauth',
    idLabel: 'Item ID',
    account: 'eBay user ID',
    portal: 'eBay',
    connectLabel: 'Sign in with eBay',
    button: 'bg-[#0064D2] text-white hover:bg-[#0057B8]',
    regions: ['United States', 'United Kingdom', 'Germany', 'Australia'],
    scopes: ['Inventory', 'Offers & pricing', 'Orders (fulfillment)'],
    tone: 'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300',
    dot: 'bg-sky-600 dark:bg-sky-400',
  },
  'TikTok Shop': {
    api: 'TikTok Shop Partner API',
    auth: 'oauth',
    idLabel: 'Product ID',
    account: 'Shop ID',
    portal: 'TikTok Shop Seller Center',
    connectLabel: 'Connect TikTok Shop',
    button: 'bg-gray-950 text-white hover:bg-black dark:bg-white dark:text-gray-950 dark:hover:bg-gray-200',
    regions: ['United States', 'United Kingdom', 'Southeast Asia'],
    scopes: ['Products', 'Prices & inventory', 'Orders'],
    tone: 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300',
    dot: 'bg-rose-600 dark:bg-rose-400',
  },
};

export const PLATFORM_NAMES = Object.keys(PLATFORMS);

export const isOAuthPlatform = (platform) => PLATFORMS[platform]?.auth === 'oauth';

export const platformSlug = (platform) => platform.toLowerCase().replace(/\s+/g, '_');
