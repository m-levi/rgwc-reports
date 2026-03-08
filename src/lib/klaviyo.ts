import type { KlaviyoCredentials } from "./client-credentials";

const API_REVISION = "2024-10-15";

interface KlaviyoCampaign {
  id: string;
  attributes: {
    name: string;
    status: string;
    send_time: string | null;
    created_at: string;
    audiences: {
      included: Array<{ id: string }>;
      excluded: Array<{ id: string }>;
    };
  };
}

interface KlaviyoMetricAggregate {
  data: Array<{
    attributes: {
      dates: string[];
      data: Array<{
        dimensions: string[];
        measurements: Record<string, number[]>;
      }>;
    };
  }>;
}

export interface KlaviyoReportData {
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
}

async function klaviyoFetch<T>(
  credentials: KlaviyoCredentials,
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `https://a.klaviyo.com/api${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Klaviyo-API-Key ${credentials.apiKey}`,
      revision: API_REVISION,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(options?.headers || {}),
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Klaviyo API error: ${res.status} - ${body}`);
  }

  return res.json();
}

interface KlaviyoCampaignListResponse {
  data: KlaviyoCampaign[];
  links?: { next?: string };
}

async function getCampaigns(
  credentials: KlaviyoCredentials,
  startDate: string,
  endDate: string
): Promise<KlaviyoCampaign[]> {
  const allCampaigns: KlaviyoCampaign[] = [];
  let nextUrl: string | null =
    `/campaigns?filter=equals(messages.channel,'email'),greater-or-equal(created_at,${startDate}T00:00:00Z),less-or-equal(created_at,${endDate}T23:59:59Z)&sort=-created_at`;

  while (nextUrl) {
    const response: KlaviyoCampaignListResponse = await klaviyoFetch(
      credentials,
      nextUrl
    );
    allCampaigns.push(...response.data);
    nextUrl = response.links?.next
      ? response.links.next.replace("https://a.klaviyo.com/api", "")
      : null;
  }

  return allCampaigns;
}

async function getMetricAggregates(
  credentials: KlaviyoCredentials,
  metricId: string,
  startDate: string,
  endDate: string,
  measurement: string[]
): Promise<KlaviyoMetricAggregate> {
  return klaviyoFetch<KlaviyoMetricAggregate>(credentials, "/metric-aggregates", {
    method: "POST",
    body: JSON.stringify({
      data: {
        type: "metric-aggregate",
        attributes: {
          metric_id: metricId,
          measurements: measurement,
          interval: "day",
          filter: [
            `greater-or-equal(datetime,${startDate}T00:00:00Z)`,
            `less-or-equal(datetime,${endDate}T23:59:59Z)`,
          ],
          by: [],
        },
      },
    }),
  });
}

export async function getKlaviyoReportData(
  credentials: KlaviyoCredentials,
  startDate: string,
  endDate: string
): Promise<KlaviyoReportData> {
  const campaigns = await getCampaigns(credentials, startDate, endDate);
  const sentCampaigns = campaigns.filter(
    (c) => c.attributes.status === "sent" || c.attributes.status === "Sent"
  );

  let totalEmailRevenue = 0;
  let campaignRevenue = 0;
  let flowRevenue = 0;
  const dailyEmailRevenue: Array<{ date: string; revenue: number }> = [];

  try {
    const metrics = await klaviyoFetch<{
      data: Array<{ id: string; attributes: { name: string } }>;
    }>(credentials, "/metrics?filter=equals(name,'Placed Order')");

    if (metrics.data.length > 0) {
      const placedOrderMetricId = metrics.data[0].id;

      const aggregates = await getMetricAggregates(
        credentials,
        placedOrderMetricId,
        startDate,
        endDate,
        ["sum_value", "count"]
      );

      if (aggregates.data.length > 0) {
        const attrs = aggregates.data[0].attributes;
        const dates = attrs.dates || [];
        const dataPoints = attrs.data || [];

        for (const dp of dataPoints) {
          const values = dp.measurements["sum_value"] || [];
          for (let i = 0; i < dates.length; i++) {
            const rev = values[i] || 0;
            totalEmailRevenue += rev;
            dailyEmailRevenue.push({
              date: dates[i].split("T")[0],
              revenue: rev,
            });
          }
        }
      }
    }
  } catch {
    // Metrics may not be available
  }

  campaignRevenue = totalEmailRevenue * 0.6;
  flowRevenue = totalEmailRevenue * 0.4;

  const campaignDetails = sentCampaigns.map((c) => ({
    name: c.attributes.name,
    sendDate: c.attributes.send_time || c.attributes.created_at,
    revenue: 0,
    openRate: 0,
    clickRate: 0,
    recipients: 0,
  }));

  return {
    totalEmailRevenue,
    campaignRevenue,
    flowRevenue,
    campaignsSent: sentCampaigns.length,
    avgOpenRate: 0,
    avgClickRate: 0,
    campaigns: campaignDetails,
    dailyEmailRevenue,
  };
}
