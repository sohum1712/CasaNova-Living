/**
 * Demo fixtures when the API returns empty arrays or fails — keeps dashboards usable in dev/demo.
 */

export const demoSalesTrend = [
  { date: '2026-03-08', transactions: 12, revenue: 1420 },
  { date: '2026-03-09', transactions: 15, revenue: 1850 },
  { date: '2026-03-10', transactions: 9, revenue: 980 },
  { date: '2026-03-11', transactions: 22, revenue: 3200 },
  { date: '2026-03-12', transactions: 18, revenue: 2100 },
  { date: '2026-03-13', transactions: 24, revenue: 2650 },
  { date: '2026-03-14', transactions: 19, revenue: 2280 },
];

export const demoCategoryPerformance = [
  { category: 'Furniture', transactions: 44, units_sold: 120, revenue: 15400, share_pct: 45 },
  { category: 'Decor', transactions: 89, units_sold: 450, revenue: 8200, share_pct: 25 },
  { category: 'Lighting', transactions: 32, units_sold: 90, revenue: 6500, share_pct: 19 },
  { category: 'Kitchen', transactions: 56, units_sold: 210, revenue: 3800, share_pct: 11 },
];

export const demoInventoryHealth = [
  { region: 'West', healthy: 88, low: 12, critical: 4 },
  { region: 'North', healthy: 92, low: 8, critical: 2 },
  { region: 'East', healthy: 75, low: 22, critical: 8 },
  { region: 'South', healthy: 95, low: 4, critical: 1 },
];

export const demoAiRecommendations = [
  { product_id: 1, name: 'Minimalist Coffee Table', category: 'Furniture', price: 299, reason: 'Trending upsell' },
  { product_id: 2, name: 'Velvet Pillow Set', category: 'Decor', price: 45, reason: 'Frequently bought together' },
  { product_id: 3, name: 'Brass Floor Lamp', category: 'Lighting', price: 180, reason: 'Regional stock optimization' },
  { product_id: 4, name: 'Ceramic Serving Bowl', category: 'Kitchen', price: 35, reason: 'High sentiment score' },
];

export const demoAiAnomalies = [
  { id: 'AN-001', type: 'Stock', severity: 'High', message: 'Unusual warehouse movement detected at Hub 2' },
  { id: 'AN-002', type: 'Billing', severity: 'Medium', message: 'Terminal timeout spike at Store 14' },
];

export const demoAiQuery = { answer: 'Operational data is connected. Ask about sales, stock, or transfers.', data_points: [] as unknown[] };

export const demoStoreComparison = [
  { store_id: 1, store_name: 'Nexus Alpha Gateway', revenue: 124000, transactions: 890 },
  { store_id: 2, store_name: 'Terminal East Retail', revenue: 98000, transactions: 720 },
  { store_id: 3, store_name: 'Vertex Park Node', revenue: 76000, transactions: 540 },
];

export const demoCategoryOptions = [
  { value: 'Beverages', label: 'Beverages' },
  { value: 'Snacks', label: 'Snacks' },
  { value: 'Dairy Alt', label: 'Dairy Alt' },
  { value: 'Dry Goods', label: 'Dry Goods' },
];

export const demoProducts = [
  { product_id: 101, product_name: 'Arctic Frost Mineral Water', brand: 'GlacierCorp', category: 'Beverages', package_size: '24 x 500ml', unit_price: 18.5 },
  { product_id: 102, product_name: 'Midnight Blend Espresso', brand: 'RoastMaster', category: 'Beverages', package_size: '12 x 250g', unit_price: 142 },
  { product_id: 103, product_name: 'Golden Harvest Oats', brand: 'NatureGrain', category: 'Dry Goods', package_size: '10 x 1kg', unit_price: 45.99 },
  { product_id: 104, product_name: 'Velvet Silk Almond Milk', brand: 'PlantPure', category: 'Dairy Alt', package_size: '12 x 1L', unit_price: 38 },
  { product_id: 105, product_name: 'Kettle Fire Potato Chips', brand: 'CrunchCo', category: 'Snacks', package_size: '15 x 150g', unit_price: 22.5 },
  { product_id: 106, product_name: 'Emerald Leaf Green Tea', brand: 'TeaZen', category: 'Beverages', package_size: '20 x 50ct', unit_price: 89 },
  { product_id: 107, product_name: 'Artisan Dark Chocolate 70%', brand: 'CacaoCo', category: 'Snacks', package_size: '24 x 80g', unit_price: 12 },
  { product_id: 108, product_name: 'Organic Honey Large Jar', brand: 'BeePure', category: 'Dry Goods', package_size: '6 x 500g', unit_price: 34.5 },
];

export const demoInventoryRows = [
  {
    inventory_id: 1,
    store_id: 1,
    product_id: 101,
    quantity_cases: 120,
    reserved_cases: 5,
    last_updated: new Date().toISOString(),
    version: 1,
    store_name: 'Nexus Alpha Gateway',
    product_name: 'Arctic Frost Mineral Water',
    brand: 'GlacierCorp',
    category: 'Beverages',
  },
  {
    inventory_id: 2,
    store_id: 2,
    product_id: 102,
    quantity_cases: 8,
    reserved_cases: 0,
    last_updated: new Date().toISOString(),
    version: 1,
    store_name: 'Terminal East Retail',
    product_name: 'Midnight Blend Espresso',
    brand: 'RoastMaster',
    category: 'Beverages',
  },
  {
    inventory_id: 3,
    store_id: 2,
    product_id: 103,
    quantity_cases: 200,
    reserved_cases: 12,
    last_updated: new Date().toISOString(),
    version: 1,
    store_name: 'Terminal East Retail',
    product_name: 'Golden Harvest Oats',
    brand: 'NatureGrain',
    category: 'Dry Goods',
  },
];

export const demoTransfers = [
  { transfer_id: 1, product_name: 'Arctic Frost Mineral Water', category: 'Beverages', from_store_name: 'Nexus Alpha Gateway', to_store_name: 'Terminal East Retail', quantity: 50, status: 'pending', created_at: new Date().toISOString() },
  { transfer_id: 2, product_name: 'Midnight Blend Espresso', category: 'Beverages', from_store_name: 'Nexus Alpha Gateway', to_store_name: 'Vertex Park Node', quantity: 12, status: 'approved', created_at: new Date(Date.now() - 86400000).toISOString() },
  { transfer_id: 3, product_name: 'Golden Harvest Oats', category: 'Dry Goods', from_store_name: 'Terminal East Retail', to_store_name: 'Nexus Alpha Gateway', quantity: 100, status: 'shipped', created_at: new Date(Date.now() - 172800000).toISOString() },
];

export const demoStoresShort = [
  { store_id: 1, store_name: 'Nexus Alpha Gateway' },
  { store_id: 2, store_name: 'Terminal East Retail' },
  { store_id: 3, store_name: 'Vertex Park Node' },
];

export const demoStoresFull = [
  { store_id: 1, store_name: 'Nexus Alpha Gateway', store_code: 'NX-001', store_type: 'Warehouse', address: '100 Logistics Blvd', city: 'Mumbai', state: 'MH', zip_code: '400001', region: 'North' },
  { store_id: 2, store_name: 'Terminal East Retail', store_code: 'TE-202', store_type: 'Urban', address: '45 Retail Plaza', city: 'Mumbai', state: 'MH', zip_code: '400012', region: 'East' },
  { store_id: 3, store_name: 'Vertex Park Node', store_code: 'VP-303', store_type: 'Suburban', address: 'Vertex Tech Park', city: 'Pune', state: 'MH', zip_code: '411001', region: 'South' },
  { store_id: 4, store_name: 'Stratos Plaza Urban', store_code: 'SP-404', store_type: 'Urban', address: 'Sky Tower 1', city: 'Bangalore', state: 'KA', zip_code: '560001', region: 'South' },
  { store_id: 5, store_name: 'Omicron Hub', store_code: 'OH-505', store_type: 'Business', address: 'Corporate Circle 5', city: 'Delhi', state: 'DL', zip_code: '110001', region: 'North' },
];

export const demoPosProducts = demoProducts.map((p) => ({
  product_id: p.product_id,
  product_name: p.product_name,
  category: p.category,
  unit_price: p.unit_price,
}));

export const demoKPI = {
  total_inventory_value: 2847500,
  total_products: 428,
  low_stock_alerts: 23,
  average_turnover: 4.2,
};

/** Shown when low-stock API fails or is empty */
export const demoLowStockAlerts = [
  { inventory_id: 2, store_name: 'Terminal East Retail', product_name: 'Midnight Blend Espresso', quantity_cases: 8, threshold: 10 },
  { inventory_id: 7, store_name: 'Vertex Park Node', product_name: 'Ceramic Bowl Set', quantity_cases: 4, threshold: 10 },
];

export const demoCategoryDistribution = [
  { category: 'Beverages', value: 420000, percentage: 32 },
  { category: 'Dry Goods', value: 310000, percentage: 24 },
  { category: 'Snacks', value: 280000, percentage: 21 },
  { category: 'Dairy Alt', value: 195000, percentage: 15 },
  { category: 'Other', value: 105000, percentage: 8 },
];

export const demoInventoryTrends = [
  { date: '2026-03-01', total_value: 2650000, total_quantity: 12000 },
  { date: '2026-03-08', total_value: 2700000, total_quantity: 12150 },
  { date: '2026-03-15', total_value: 2847500, total_quantity: 12400 },
];

/** Use live data when non-empty; otherwise demo. */
export function withDemoFallback<T>(live: T[] | null | undefined, demo: T[]): T[] {
  if (Array.isArray(live) && live.length > 0) return live;
  return demo;
}
