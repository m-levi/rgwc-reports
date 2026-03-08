import { getShopifyConfig } from "./env";

const API_VERSION = "2024-01";

interface ShopifyOrder {
  id: number;
  created_at: string;
  total_price: string;
  currency: string;
  line_items: Array<{
    title: string;
    quantity: number;
    price: string;
    product_id: number;
  }>;
  source_name: string;
  tags: string;
  financial_status: string;
  cancelled_at: string | null;
}

export interface ShopifyReportData {
  totalRevenue: number;
  totalOrders: number;
  aov: number;
  currency: string;
  revenueByChannel: Record<string, number>;
  ordersByChannel: Record<string, number>;
  topProducts: Array<{
    title: string;
    quantity: number;
    revenue: number;
  }>;
  dailyRevenue: Array<{ date: string; revenue: number; orders: number }>;
}

async function shopifyFetch<T>(endpoint: string): Promise<T> {
  const config = getShopifyConfig();
  if (!config) throw new Error("Shopify not configured");

  const url = `https://${config.domain}/admin/api/${API_VERSION}${endpoint}`;
  const res = await fetch(url, {
    headers: {
      "X-Shopify-Access-Token": config.accessToken,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`Shopify API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

interface ShopifyOrdersResponse {
  orders: ShopifyOrder[];
}

async function fetchAllOrders(
  startDate: string,
  endDate: string
): Promise<ShopifyOrder[]> {
  const allOrders: ShopifyOrder[] = [];
  let pageUrl: string | null =
    `/orders.json?created_at_min=${startDate}T00:00:00Z&created_at_max=${endDate}T23:59:59Z&status=any&limit=250`;

  while (pageUrl) {
    const response: ShopifyOrdersResponse = await shopifyFetch(pageUrl);
    allOrders.push(...response.orders);

    // Simple pagination - if we got 250, there might be more
    if (response.orders.length === 250) {
      const lastId = response.orders[response.orders.length - 1].id;
      pageUrl = `/orders.json?created_at_min=${startDate}T00:00:00Z&created_at_max=${endDate}T23:59:59Z&status=any&limit=250&since_id=${lastId}`;
    } else {
      pageUrl = null;
    }
  }

  return allOrders;
}

function mapSourceToChannel(sourceName: string): string {
  const map: Record<string, string> = {
    web: "Online Store",
    pos: "Point of Sale",
    shopify_draft_order: "Draft Orders (B2B/Wholesale)",
    iphone: "Shopify Mobile",
    android: "Shopify Mobile",
    "580111": "Online Store", // Shopify Flow / automation
  };
  return map[sourceName] || sourceName || "Other";
}

export async function getShopifyReportData(
  startDate: string,
  endDate: string
): Promise<ShopifyReportData> {
  const orders = await fetchAllOrders(startDate, endDate);

  // Filter out cancelled orders
  const validOrders = orders.filter(
    (o) => !o.cancelled_at && o.financial_status !== "voided"
  );

  const currency = validOrders[0]?.currency || "GBP";
  let totalRevenue = 0;
  const revenueByChannel: Record<string, number> = {};
  const ordersByChannel: Record<string, number> = {};
  const productMap: Map<string, { quantity: number; revenue: number }> =
    new Map();
  const dailyMap: Map<string, { revenue: number; orders: number }> = new Map();

  for (const order of validOrders) {
    const price = parseFloat(order.total_price);
    totalRevenue += price;

    const channel = mapSourceToChannel(order.source_name);
    revenueByChannel[channel] = (revenueByChannel[channel] || 0) + price;
    ordersByChannel[channel] = (ordersByChannel[channel] || 0) + 1;

    // Products
    for (const item of order.line_items) {
      const existing = productMap.get(item.title) || {
        quantity: 0,
        revenue: 0,
      };
      existing.quantity += item.quantity;
      existing.revenue += parseFloat(item.price) * item.quantity;
      productMap.set(item.title, existing);
    }

    // Daily breakdown
    const day = order.created_at.split("T")[0];
    const dayData = dailyMap.get(day) || { revenue: 0, orders: 0 };
    dayData.revenue += price;
    dayData.orders += 1;
    dailyMap.set(day, dayData);
  }

  const topProducts = Array.from(productMap.entries())
    .map(([title, data]) => ({ title, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 15);

  const dailyRevenue = Array.from(dailyMap.entries())
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    totalRevenue,
    totalOrders: validOrders.length,
    aov: validOrders.length > 0 ? totalRevenue / validOrders.length : 0,
    currency,
    revenueByChannel,
    ordersByChannel,
    topProducts,
    dailyRevenue,
  };
}
