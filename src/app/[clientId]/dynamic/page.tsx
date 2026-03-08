"use client";

import { useParams } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import type { DynamicReportData } from "@/lib/types";

function formatCurrency(value: number, currency = "GBP"): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Date presets
function getPreset(key: string): { start: string; end: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  switch (key) {
    case "this-month": {
      const start = new Date(year, month, 1);
      return {
        start: start.toISOString().split("T")[0],
        end: now.toISOString().split("T")[0],
      };
    }
    case "last-month": {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0);
      return {
        start: start.toISOString().split("T")[0],
        end: end.toISOString().split("T")[0],
      };
    }
    case "last-30": {
      const start = new Date(now);
      start.setDate(start.getDate() - 30);
      return {
        start: start.toISOString().split("T")[0],
        end: now.toISOString().split("T")[0],
      };
    }
    case "last-90": {
      const start = new Date(now);
      start.setDate(start.getDate() - 90);
      return {
        start: start.toISOString().split("T")[0],
        end: now.toISOString().split("T")[0],
      };
    }
    default:
      return { start: "", end: "" };
  }
}

// Simple bar chart using canvas
function BarChart({
  data,
  width = 600,
  height = 260,
  color = "#1e293b",
  label = "Revenue",
}: {
  data: Array<{ label: string; value: number }>;
  width?: number;
  height?: number;
  color?: string;
  label?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const padding = { top: 30, right: 20, bottom: 50, left: 60 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    ctx.clearRect(0, 0, width, height);

    const maxVal = Math.max(...data.map((d) => d.value), 1);

    // Y-axis gridlines
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 0.5;
    ctx.fillStyle = "#9ca3af";
    ctx.font = "11px -apple-system, sans-serif";
    ctx.textAlign = "right";

    for (let i = 0; i <= 4; i++) {
      const y = padding.top + chartH - (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
      const val = (maxVal / 4) * i;
      ctx.fillText(
        val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val.toFixed(0),
        padding.left - 8,
        y + 4
      );
    }

    // Bars
    const barWidth = Math.max(
      2,
      Math.min(24, (chartW / data.length) * 0.7)
    );
    const gap = (chartW - barWidth * data.length) / (data.length + 1);

    data.forEach((d, i) => {
      const x = padding.left + gap + i * (barWidth + gap);
      const barH = (d.value / maxVal) * chartH;
      const y = padding.top + chartH - barH;

      ctx.fillStyle = color;
      ctx.beginPath();
      const r = Math.min(3, barWidth / 2);
      ctx.roundRect(x, y, barWidth, barH, [r, r, 0, 0]);
      ctx.fill();
    });

    // X-axis labels (show ~8 max)
    ctx.fillStyle = "#9ca3af";
    ctx.font = "10px -apple-system, sans-serif";
    ctx.textAlign = "center";
    const step = Math.max(1, Math.floor(data.length / 8));
    data.forEach((d, i) => {
      if (i % step !== 0) return;
      const x = padding.left + gap + i * (barWidth + gap) + barWidth / 2;
      ctx.save();
      ctx.translate(x, height - padding.bottom + 14);
      ctx.rotate(-0.4);
      ctx.fillText(d.label, 0, 0);
      ctx.restore();
    });

    // Label
    ctx.fillStyle = "#6b7280";
    ctx.font = "bold 11px -apple-system, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(label, padding.left, 16);
  }, [data, width, height, color, label]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: `${width}px`, height: `${height}px`, maxWidth: "100%" }}
    />
  );
}

// Donut chart
function DonutChart({
  segments,
  size = 200,
}: {
  segments: Array<{ label: string; value: number; color: string }>;
  size?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || segments.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const radius = size / 2 - 10;
    const innerRadius = radius * 0.55;
    const total = segments.reduce((s, seg) => s + seg.value, 0);

    ctx.clearRect(0, 0, size, size);

    let startAngle = -Math.PI / 2;
    segments.forEach((seg) => {
      const sliceAngle = (seg.value / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, startAngle, startAngle + sliceAngle);
      ctx.arc(cx, cy, innerRadius, startAngle + sliceAngle, startAngle, true);
      ctx.closePath();
      ctx.fillStyle = seg.color;
      ctx.fill();
      startAngle += sliceAngle;
    });
  }, [segments, size]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: `${size}px`, height: `${size}px`, maxWidth: "100%" }}
    />
  );
}

export default function DynamicReportPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<DynamicReportData | null>(null);
  const [error, setError] = useState("");

  const fetchReport = useCallback(async () => {
    if (!startDate || !endDate) return;
    setLoading(true);
    setError("");
    setReport(null);

    try {
      const res = await fetch(
        `/api/dynamic-report/${clientId}?start=${startDate}&end=${endDate}`
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch report");
      }
      const data: DynamicReportData = await res.json();
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [clientId, startDate, endDate]);

  const applyPreset = (key: string) => {
    const { start, end } = getPreset(key);
    setStartDate(start);
    setEndDate(end);
  };

  const channelColors = [
    "#1e293b",
    "#3b82f6",
    "#d97706",
    "#059669",
    "#8b5cf6",
    "#ec4899",
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div className="dynamic-header">
          <div>
            <h1 className="page-header__title">Dynamic Report Builder</h1>
            <p className="page-header__count">
              Generate reports from live Shopify & Klaviyo data
            </p>
          </div>
          <Link href={`/${clientId}`} className="dynamic-back-link">
            View Static Reports
          </Link>
        </div>
      </div>

      {/* Date Selection */}
      <div className="dynamic-controls">
        <div className="date-presets">
          <button
            className="preset-btn"
            onClick={() => applyPreset("this-month")}
          >
            This Month
          </button>
          <button
            className="preset-btn"
            onClick={() => applyPreset("last-month")}
          >
            Last Month
          </button>
          <button
            className="preset-btn"
            onClick={() => applyPreset("last-30")}
          >
            Last 30 Days
          </button>
          <button
            className="preset-btn"
            onClick={() => applyPreset("last-90")}
          >
            Last 90 Days
          </button>
        </div>

        <div className="date-inputs">
          <div className="date-field">
            <label className="date-label">Start Date</label>
            <input
              type="date"
              className="date-input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <span className="date-separator">to</span>
          <div className="date-field">
            <label className="date-label">End Date</label>
            <input
              type="date"
              className="date-input"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <button
            className="generate-btn"
            onClick={fetchReport}
            disabled={!startDate || !endDate || loading}
          >
            {loading ? "Generating..." : "Generate Report"}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && <div className="dynamic-error">{error}</div>}

      {/* Loading */}
      {loading && (
        <div className="dynamic-loading">
          <div className="loading-spinner" />
          <p>Fetching data from Shopify & Klaviyo...</p>
        </div>
      )}

      {/* Report Content */}
      {report && !loading && (
        <div className="dynamic-report">
          {/* API Warnings */}
          {report.errors.length > 0 && (
            <div className="dynamic-warnings">
              <strong>Warnings:</strong>
              {report.errors.map((e, i) => (
                <div key={i} className="warning-item">
                  {e}
                </div>
              ))}
            </div>
          )}

          {/* Date Range Banner */}
          <div className="dynamic-banner">
            Report: {formatDate(report.dateRange.start)} &mdash;{" "}
            {formatDate(report.dateRange.end)}
          </div>

          {/* KPI Overview */}
          {report.shopify && (
            <section className="dynamic-section">
              <h2 className="dynamic-section__title">Revenue Overview</h2>
              <div className="dynamic-kpi-grid">
                <div className="dynamic-kpi">
                  <div className="dynamic-kpi__label">Total Revenue</div>
                  <div className="dynamic-kpi__value">
                    {formatCurrency(
                      report.shopify.totalRevenue,
                      report.shopify.currency
                    )}
                  </div>
                </div>
                <div className="dynamic-kpi">
                  <div className="dynamic-kpi__label">Orders</div>
                  <div className="dynamic-kpi__value">
                    {report.shopify.totalOrders.toLocaleString()}
                  </div>
                </div>
                <div className="dynamic-kpi">
                  <div className="dynamic-kpi__label">AOV</div>
                  <div className="dynamic-kpi__value">
                    {formatCurrency(
                      report.shopify.aov,
                      report.shopify.currency
                    )}
                  </div>
                </div>
                {report.klaviyo && (
                  <div className="dynamic-kpi">
                    <div className="dynamic-kpi__label">Email Revenue</div>
                    <div className="dynamic-kpi__value">
                      {formatCurrency(
                        report.klaviyo.totalEmailRevenue,
                        report.shopify.currency
                      )}
                    </div>
                  </div>
                )}
                {report.klaviyo && (
                  <div className="dynamic-kpi">
                    <div className="dynamic-kpi__label">Campaigns Sent</div>
                    <div className="dynamic-kpi__value">
                      {report.klaviyo.campaignsSent}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Daily Revenue Chart */}
          {report.shopify && report.shopify.dailyRevenue.length > 0 && (
            <section className="dynamic-section">
              <h2 className="dynamic-section__title">Daily Revenue</h2>
              <div className="chart-container">
                <BarChart
                  data={report.shopify.dailyRevenue.map((d) => ({
                    label: d.date.slice(5), // MM-DD
                    value: d.revenue,
                  }))}
                  label="Revenue (£)"
                  color="#1e293b"
                />
              </div>
            </section>
          )}

          {/* Revenue by Channel */}
          {report.shopify &&
            Object.keys(report.shopify.revenueByChannel).length > 0 && (
              <section className="dynamic-section">
                <h2 className="dynamic-section__title">Revenue by Channel</h2>
                <div className="chart-and-table">
                  <div className="chart-container chart-container--donut">
                    <DonutChart
                      segments={Object.entries(
                        report.shopify.revenueByChannel
                      ).map(([label, value], i) => ({
                        label,
                        value,
                        color: channelColors[i % channelColors.length],
                      }))}
                    />
                  </div>
                  <div className="channel-table-wrap">
                    <table className="dynamic-table">
                      <thead>
                        <tr>
                          <th>Channel</th>
                          <th>Revenue</th>
                          <th>Orders</th>
                          <th>Share</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(report.shopify.revenueByChannel)
                          .sort((a, b) => b[1] - a[1])
                          .map(([channel, revenue], i) => (
                            <tr key={channel}>
                              <td>
                                <span
                                  className="channel-dot"
                                  style={{
                                    backgroundColor:
                                      channelColors[
                                        i % channelColors.length
                                      ],
                                  }}
                                />
                                {channel}
                              </td>
                              <td>
                                {formatCurrency(
                                  revenue,
                                  report.shopify!.currency
                                )}
                              </td>
                              <td>
                                {(
                                  report.shopify!.ordersByChannel[channel] || 0
                                ).toLocaleString()}
                              </td>
                              <td>
                                {(
                                  (revenue / report.shopify!.totalRevenue) *
                                  100
                                ).toFixed(1)}
                                %
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}

          {/* Top Products */}
          {report.shopify && report.shopify.topProducts.length > 0 && (
            <section className="dynamic-section">
              <h2 className="dynamic-section__title">Top Products</h2>
              <div className="table-scroll">
                <table className="dynamic-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Product</th>
                      <th>Qty Sold</th>
                      <th>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.shopify.topProducts.map((p, i) => (
                      <tr key={i}>
                        <td className="rank-cell">{i + 1}</td>
                        <td>{p.title}</td>
                        <td>{p.quantity}</td>
                        <td>
                          {formatCurrency(p.revenue, report.shopify!.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Email Performance */}
          {report.klaviyo && (
            <section className="dynamic-section">
              <h2 className="dynamic-section__title">Email Performance</h2>
              <div className="dynamic-kpi-grid">
                <div className="dynamic-kpi">
                  <div className="dynamic-kpi__label">Email Revenue</div>
                  <div className="dynamic-kpi__value">
                    {formatCurrency(report.klaviyo.totalEmailRevenue)}
                  </div>
                </div>
                <div className="dynamic-kpi">
                  <div className="dynamic-kpi__label">Campaign Revenue</div>
                  <div className="dynamic-kpi__value">
                    {formatCurrency(report.klaviyo.campaignRevenue)}
                  </div>
                </div>
                <div className="dynamic-kpi">
                  <div className="dynamic-kpi__label">Flow Revenue</div>
                  <div className="dynamic-kpi__value">
                    {formatCurrency(report.klaviyo.flowRevenue)}
                  </div>
                </div>
                <div className="dynamic-kpi">
                  <div className="dynamic-kpi__label">Campaigns Sent</div>
                  <div className="dynamic-kpi__value">
                    {report.klaviyo.campaignsSent}
                  </div>
                </div>
              </div>

              {report.klaviyo.dailyEmailRevenue.length > 0 && (
                <div className="chart-container" style={{ marginTop: 24 }}>
                  <BarChart
                    data={report.klaviyo.dailyEmailRevenue.map((d) => ({
                      label: d.date.slice(5),
                      value: d.revenue,
                    }))}
                    label="Email Revenue (£)"
                    color="#3b82f6"
                  />
                </div>
              )}
            </section>
          )}

          {/* No data state */}
          {!report.shopify && !report.klaviyo && (
            <div className="dynamic-empty">
              <p>
                No data available. Make sure your API keys are configured in{" "}
                <code>.env</code>
              </p>
              <p className="dynamic-empty__sub">
                Copy <code>.env.example</code> to <code>.env</code> and add
                your Shopify and Klaviyo credentials.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
