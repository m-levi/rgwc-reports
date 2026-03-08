"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface CredentialStatus {
  shopify: boolean;
  klaviyo: boolean;
}

export default function CredentialsPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const [status, setStatus] = useState<CredentialStatus>({ shopify: false, klaviyo: false });
  const [loading, setLoading] = useState(true);

  // Shopify fields
  const [shopifyDomain, setShopifyDomain] = useState("");
  const [shopifyToken, setShopifyToken] = useState("");
  const [shopifySaving, setShopifySaving] = useState(false);
  const [shopifyMsg, setShopifyMsg] = useState("");

  // Klaviyo fields
  const [klaviyoKey, setKlaviyoKey] = useState("");
  const [klaviyoSaving, setKlaviyoSaving] = useState(false);
  const [klaviyoMsg, setKlaviyoMsg] = useState("");

  useEffect(() => {
    fetch(`/api/admin/clients/${clientId}/credentials`)
      .then((r) => r.json())
      .then((data) => {
        setStatus(data);
        setLoading(false);
      });
  }, [clientId]);

  const saveShopify = async (e: React.FormEvent) => {
    e.preventDefault();
    setShopifySaving(true);
    setShopifyMsg("");

    const res = await fetch(`/api/admin/clients/${clientId}/credentials`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider: "shopify",
        credentials: { domain: shopifyDomain, accessToken: shopifyToken },
      }),
    });

    if (res.ok) {
      setShopifyMsg("Shopify credentials saved");
      setStatus((s) => ({ ...s, shopify: true }));
      setShopifyDomain("");
      setShopifyToken("");
    } else {
      const data = await res.json();
      setShopifyMsg(data.error || "Failed to save");
    }
    setShopifySaving(false);
  };

  const saveKlaviyo = async (e: React.FormEvent) => {
    e.preventDefault();
    setKlaviyoSaving(true);
    setKlaviyoMsg("");

    const res = await fetch(`/api/admin/clients/${clientId}/credentials`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider: "klaviyo",
        credentials: { apiKey: klaviyoKey },
      }),
    });

    if (res.ok) {
      setKlaviyoMsg("Klaviyo credentials saved");
      setStatus((s) => ({ ...s, klaviyo: true }));
      setKlaviyoKey("");
    } else {
      const data = await res.json();
      setKlaviyoMsg(data.error || "Failed to save");
    }
    setKlaviyoSaving(false);
  };

  if (loading) {
    return <div className="dynamic-loading"><div className="loading-spinner" /></div>;
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1>API Credentials</h1>
          <p>
            Client: <code>{clientId}</code> &mdash;{" "}
            <Link href={`/admin/clients/${clientId}`} style={{ textDecoration: "underline" }}>
              Back to client
            </Link>
          </p>
        </div>
      </div>

      <div className="credential-cards">
        {/* Shopify Card */}
        <div className="credential-card">
          <div className="credential-card__header">
            <h2 className="credential-card__title">Shopify</h2>
            <span
              className={`status-badge ${
                status.shopify ? "status-badge--active" : "status-badge--inactive"
              }`}
            >
              {status.shopify ? "Connected" : "Not configured"}
            </span>
          </div>

          <form onSubmit={saveShopify}>
            <div className="credential-card__fields">
              <div className="admin-form__group" style={{ marginBottom: 0 }}>
                <label className="admin-form__label">Store Domain</label>
                <input
                  className="admin-form__input"
                  value={shopifyDomain}
                  onChange={(e) => setShopifyDomain(e.target.value)}
                  placeholder="your-store.myshopify.com"
                  required
                />
              </div>
              <div className="admin-form__group" style={{ marginBottom: 0 }}>
                <label className="admin-form__label">Access Token</label>
                <input
                  className="admin-form__input"
                  type="password"
                  value={shopifyToken}
                  onChange={(e) => setShopifyToken(e.target.value)}
                  placeholder="shpat_..."
                  required
                />
              </div>
            </div>
            {shopifyMsg && (
              <div
                className={`admin-alert ${
                  shopifyMsg.includes("saved") ? "admin-alert--success" : "admin-alert--error"
                }`}
              >
                {shopifyMsg}
              </div>
            )}
            <div className="credential-card__actions">
              <button type="submit" className="admin-btn admin-btn--small" disabled={shopifySaving}>
                {shopifySaving ? "Saving..." : status.shopify ? "Update Credentials" : "Save Credentials"}
              </button>
            </div>
          </form>
        </div>

        {/* Klaviyo Card */}
        <div className="credential-card">
          <div className="credential-card__header">
            <h2 className="credential-card__title">Klaviyo</h2>
            <span
              className={`status-badge ${
                status.klaviyo ? "status-badge--active" : "status-badge--inactive"
              }`}
            >
              {status.klaviyo ? "Connected" : "Not configured"}
            </span>
          </div>

          <form onSubmit={saveKlaviyo}>
            <div className="credential-card__fields">
              <div className="admin-form__group" style={{ marginBottom: 0 }}>
                <label className="admin-form__label">API Key</label>
                <input
                  className="admin-form__input"
                  type="password"
                  value={klaviyoKey}
                  onChange={(e) => setKlaviyoKey(e.target.value)}
                  placeholder="pk_..."
                  required
                />
              </div>
            </div>
            {klaviyoMsg && (
              <div
                className={`admin-alert ${
                  klaviyoMsg.includes("saved") ? "admin-alert--success" : "admin-alert--error"
                }`}
              >
                {klaviyoMsg}
              </div>
            )}
            <div className="credential-card__actions">
              <button type="submit" className="admin-btn admin-btn--small" disabled={klaviyoSaving}>
                {klaviyoSaving ? "Saving..." : status.klaviyo ? "Update Credentials" : "Save Credentials"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
