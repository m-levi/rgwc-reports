export interface DynamicReportData {
  dateRange: {
    start: string;
    end: string;
  };
  shopify: {
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
  } | null;
  klaviyo: {
    totalEmailRevenue: number;
    campaignRevenue: number;
    flowRevenue: number;
    campaignsSent: number;
    avgOpenRate: number;
    avgClickRate: number;
    campaigns: Array<{
      name: string;
      sendDate: string;
      revenue: number;
      openRate: number;
      clickRate: number;
      recipients: number;
    }>;
    dailyEmailRevenue: Array<{ date: string; revenue: number }>;
  } | null;
  errors: string[];
}
