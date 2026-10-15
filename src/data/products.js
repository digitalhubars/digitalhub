import { stores } from './stores';

// [storeId, title, category, price, stock]
const productSeed = [
  ['st_01', 'Trail Pack 28L', 'Bags', 129, 42],
  ['st_01', 'Merino Base Layer', 'Apparel', 74, 8],
  ['st_01', 'Insulated Bottle 750ml', 'Gear', 34, 96],
  ['st_02', 'House Blend Beans 1kg', 'Coffee', 32.5, 120],
  ['st_02', 'Pour-Over Kettle', 'Brewing', 58, 0],
  ['st_02', 'Ceramic Dripper', 'Brewing', 26, 37],
  ['st_03', 'Linen Throw Blanket', 'Textiles', 89, 17],
  ['st_03', 'Hand-Dyed Napkin Set', 'Textiles', 36, 64],
  ['st_03', 'Cotton Tote Bag', 'Bags', 24, 6],
  ['st_04', 'Terracotta Planter, Large', 'Garden', 46, 23],
  ['st_04', 'Woven Wall Hanging', 'Decor', 112, 5],
  ['st_04', 'Stoneware Vase', 'Decor', 54, 31],
  ['st_05', 'Studio Headphones H2', 'Audio', 199, 31],
  ['st_05', 'Braided Audio Cable 3m', 'Cables', 19, 210],
  ['st_05', 'Desktop Speaker Pair', 'Audio', 249, 4],
  ['st_06', 'Organic Cotton Romper', 'Baby', 28, 54],
  ['st_06', 'Wooden Stacking Rings', 'Toys', 22, 3],
  ['st_06', 'Knit Baby Blanket', 'Baby', 39, 18],
  ['st_07', 'Ultralight Tent 2P', 'Camping', 189, 14],
  ['st_07', 'Carbon Trekking Poles', 'Gear', 79, 52],
  ['st_07', 'Headlamp 400lm', 'Gear', 29, 7],
  ['st_08', 'Vintage Film Camera, 35mm', 'Cameras', 145, 2],
  ['st_08', 'Brass Desk Lamp, 1960s', 'Lighting', 98, 1],
  ['st_08', 'Vinyl Record Crate', 'Storage', 42, 12],
  ['st_09', 'Vitamin C Serum 30ml', 'Skincare', 24, 180],
  ['st_09', 'Lip Tint Trio', 'Makeup', 18, 9],
  ['st_09', 'Jade Face Roller', 'Tools', 15, 65],
  ['st_10', 'Trail Pack 28L', 'Bags', 134, 20],
  ['st_10', 'Insulated Bottle 750ml', 'Gear', 36, 44],
];

export function externalIdFor(platform, index) {
  switch (platform) {
    case 'Shopify':
      return `gid://shopify/Product/${80100 + index}`;
    case 'WooCommerce':
      return `wc_${1000 + index}`;
    case 'Amazon':
      return `B0C${String(1e6 + index * 7919).slice(-7)}`;
    case 'eBay':
      return String(2958e8 + index * 1373);
    default:
      return `17293${String(1e10 + index * 99991).slice(-11)}`;
  }
}

export const products = productSeed.map(([storeId, title, category, price, stock], index) => {
  const platform = stores.find((s) => s.id === storeId).platform;
  return {
    id: `p_${String(index + 1).padStart(2, '0')}`,
    storeId,
    title,
    category,
    price,
    stock,
    sku: `${storeId.replace('st_', 'S')}-${String(100 + index)}`,
    externalId: externalIdFor(platform, index),
    status: stock === 0 ? 'out_of_stock' : index % 7 === 5 ? 'draft' : 'active',
  };
});
