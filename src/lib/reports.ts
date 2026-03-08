import fs from "fs";
import path from "path";

export interface ReportMeta {
  slug: string;
  title: string;
  date: string;
  revenue: string;
  orders: number;
  aov: string;
  sessions: number;
  emailRevenue: string;
  highlights: string[];
}

function getClientReportsDir(clientId: string) {
  return path.join(process.cwd(), "public", "reports", clientId);
}

export function getAllReports(clientId: string): ReportMeta[] {
  const dir = getClientReportsDir(clientId);
  if (!fs.existsSync(dir)) return [];

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  const reports: ReportMeta[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const metaPath = path.join(dir, entry.name, "meta.json");
    if (!fs.existsSync(metaPath)) continue;

    try {
      const raw = fs.readFileSync(metaPath, "utf-8");
      const meta = JSON.parse(raw);
      reports.push({ slug: entry.name, ...meta });
    } catch {
      // skip malformed meta.json
    }
  }

  // Sort by date descending (newest first)
  reports.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return reports;
}

export function getReport(clientId: string, slug: string): ReportMeta | null {
  const metaPath = path.join(getClientReportsDir(clientId), slug, "meta.json");
  if (!fs.existsSync(metaPath)) return null;

  try {
    const raw = fs.readFileSync(metaPath, "utf-8");
    const meta = JSON.parse(raw);
    return { slug, ...meta };
  } catch {
    return null;
  }
}
