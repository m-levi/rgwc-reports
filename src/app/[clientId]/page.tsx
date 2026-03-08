"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface ReportMeta {
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

export default function ClientReports() {
  const { clientId } = useParams<{ clientId: string }>();
  const [reports, setReports] = useState<ReportMeta[]>([]);
  const [search, setSearch] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch(`/api/reports/${clientId}`)
      .then((r) => r.json())
      .then((data) => {
        setReports(data);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [clientId]);

  const filtered = reports.filter((r) =>
    r.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header__row">
          <div>
            <h1 className="page-header__title">Monthly Reports</h1>
            <p className="page-header__count">
              {reports.length} report{reports.length !== 1 ? "s" : ""} available
            </p>
          </div>
          <Link href={`/${clientId}/dynamic`} className="dynamic-report-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            Dynamic Report
          </Link>
        </div>
      </div>

      {loaded && reports.length > 0 && (
        <div className="search-bar">
          <svg
            className="search-bar__icon"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className="search-bar__input"
            type="text"
            placeholder="Search reports..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}

      {loaded && reports.length === 0 && (
        <div className="empty-state">
          <div className="empty-state__icon">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <div className="empty-state__title">No reports yet</div>
          <div className="empty-state__text">
            Add a report folder to <code>public/reports/{clientId}/</code> with a{" "}
            <code>report.html</code> and <code>meta.json</code>.
          </div>
        </div>
      )}

      {loaded && reports.length > 0 && filtered.length === 0 && (
        <div className="no-results">
          No reports match &ldquo;{search}&rdquo;
        </div>
      )}

      <div className="reports-grid">
        {filtered.map((report) => (
          <Link
            key={report.slug}
            href={`/${clientId}/${report.slug}`}
            className="report-card"
          >
            <div className="report-card__header">
              <div>
                <div className="report-card__title">{report.title}</div>
                <div className="report-card__date">
                  {new Date(report.date).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
              </div>
              <span className="report-card__arrow">&rarr;</span>
            </div>

            <div className="kpi-row">
              <div className="kpi-item">
                <div className="kpi-item__label">Revenue</div>
                <div className="kpi-item__value">{report.revenue}</div>
              </div>
              <div className="kpi-item">
                <div className="kpi-item__label">Orders</div>
                <div className="kpi-item__value">
                  {report.orders.toLocaleString()}
                </div>
              </div>
              <div className="kpi-item">
                <div className="kpi-item__label">AOV</div>
                <div className="kpi-item__value">{report.aov}</div>
              </div>
              <div className="kpi-item">
                <div className="kpi-item__label">Email Rev</div>
                <div className="kpi-item__value">{report.emailRevenue}</div>
              </div>
            </div>

            {report.highlights && report.highlights.length > 0 && (
              <div className="highlights">
                {report.highlights.map((h, i) => (
                  <div key={i} className="highlight-item">
                    {h}
                  </div>
                ))}
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
