import Link from "next/link";
import { getReport, getAllReports } from "@/lib/reports";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ReportPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const report = getReport(slug);
  if (!report) notFound();

  const allReports = getAllReports();
  const currentIndex = allReports.findIndex((r) => r.slug === slug);
  const prevReport = currentIndex < allReports.length - 1 ? allReports[currentIndex + 1] : null;
  const nextReport = currentIndex > 0 ? allReports[currentIndex - 1] : null;

  return (
    <div className="report-viewer">
      <div className="report-subheader">
        <Link href="/" className="report-subheader__back">
          &larr; All Reports
        </Link>
        <span className="report-subheader__divider">|</span>
        <span className="report-subheader__title">{report.title}</span>

        <div className="report-subheader__nav">
          {nextReport && (
            <Link
              href={`/reports/${nextReport.slug}`}
              className="report-subheader__nav-btn"
            >
              {nextReport.title} &rarr;
            </Link>
          )}
          {prevReport && (
            <Link
              href={`/reports/${prevReport.slug}`}
              className="report-subheader__nav-btn"
            >
              {prevReport.title} &rarr;
            </Link>
          )}
        </div>
      </div>

      <iframe
        src={`/reports/${slug}/report.html`}
        className="report-iframe"
        title={report.title}
      />
    </div>
  );
}
