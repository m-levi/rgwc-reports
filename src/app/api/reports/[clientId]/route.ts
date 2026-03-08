import { NextResponse } from "next/server";
import { getAllReports } from "@/lib/reports";
import { getClient } from "@/lib/clients";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params;
  const client = getClient(clientId);
  if (!client) {
    return NextResponse.json([], { status: 404 });
  }
  return NextResponse.json(getAllReports(clientId));
}
