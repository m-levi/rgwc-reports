import { NextResponse } from "next/server";
import { getClient } from "@/lib/clients";
import { getShopifyReportData } from "@/lib/shopify";
import { getKlaviyoReportData } from "@/lib/klaviyo";
import { getShopifyConfig, getKlaviyoConfig } from "@/lib/env";
import type { DynamicReportData } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params;
  const client = getClient(clientId);
  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const url = new URL(request.url);
  const startDate = url.searchParams.get("start");
  const endDate = url.searchParams.get("end");

  if (!startDate || !endDate) {
    return NextResponse.json(
      { error: "start and end query parameters are required (YYYY-MM-DD)" },
      { status: 400 }
    );
  }

  // Validate date format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
    return NextResponse.json(
      { error: "Dates must be in YYYY-MM-DD format" },
      { status: 400 }
    );
  }

  const errors: string[] = [];
  let shopifyData: DynamicReportData["shopify"] = null;
  let klaviyoData: DynamicReportData["klaviyo"] = null;

  // Fetch Shopify data
  if (getShopifyConfig()) {
    try {
      shopifyData = await getShopifyReportData(startDate, endDate);
    } catch (err) {
      errors.push(
        `Shopify: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    }
  } else {
    errors.push("Shopify: Not configured (missing environment variables)");
  }

  // Fetch Klaviyo data
  if (getKlaviyoConfig()) {
    try {
      klaviyoData = await getKlaviyoReportData(startDate, endDate);
    } catch (err) {
      errors.push(
        `Klaviyo: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    }
  } else {
    errors.push("Klaviyo: Not configured (missing environment variables)");
  }

  const report: DynamicReportData = {
    dateRange: { start: startDate, end: endDate },
    shopify: shopifyData,
    klaviyo: klaviyoData,
    errors,
  };

  return NextResponse.json(report);
}
