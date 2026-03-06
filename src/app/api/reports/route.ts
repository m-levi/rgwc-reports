import { NextResponse } from "next/server";
import { getAllReports } from "@/lib/reports";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(getAllReports());
}
