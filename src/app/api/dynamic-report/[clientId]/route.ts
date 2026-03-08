import { NextResponse } from "next/server";
import { getClient } from "@/lib/clients";
import { getShopifyReportData } from "@/lib/shopify";
import { getKlaviyoReportData } from "@/lib/klaviyo";
import { getClientCredentials } from "@/lib/client-credentials";
import type { DynamicReportData } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params;
  const client = await getClient(clientId);
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

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
    return NextResponse.json(
      { error: "Dates must be in YYYY-MM-DD format" },
      { status: 400 }
    );
  }

  // Get per-client credentials (with env var fallback)
  const creds = await getClientCredentials(clientId);

  const errors: string[] = [];
  let shopifyData: DynamicReportData["shopify"] = null;
  let klaviyoData: DynamicReportData["klaviyo"] = null;

  // Fetch both APIs in parallel
  const [shopifyResult, klaviyoResult] = await Promise.allSettled([
    creds.shopify
      ? getShopifyReportData(creds.shopify, startDate, endDate)
      : Promise.reject(new Error("Not configured")),
    creds.klaviyo
      ? getKlaviyoReportData(creds.klaviyo, startDate, endDate)
      : Promise.reject(new Error("Not configured")),
  ]);

  if (shopifyResult.status === "fulfilled") {
    shopifyData = shopifyResult.value;
  } else {
    const msg = shopifyResult.reason?.message || "Unknown error";
    errors.push(
      msg === "Not configured"
        ? "Shopify: Not configured (add credentials in Admin)"
        : `Shopify: ${msg}`
    );
  }

  if (klaviyoResult.status === "fulfilled") {
    klaviyoData = klaviyoResult.value;
  } else {
    const msg = klaviyoResult.reason?.message || "Unknown error";
    errors.push(
      msg === "Not configured"
        ? "Klaviyo: Not configured (add credentials in Admin)"
        : `Klaviyo: ${msg}`
    );
  }

  const report: DynamicReportData = {
    dateRange: { start: startDate, end: endDate },
    shopify: shopifyData,
    klaviyo: klaviyoData,
    errors,
  };

  return NextResponse.json(report);
}
