"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface Client {
  id: string;
  name: string;
  subtitle: string;
  is_active: boolean;
}

export default function EditClientPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [name, setName] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/clients/${clientId}`)
      .then((r) => r.json())
      .then((data) => {
        setClient(data);
        setName(data.name);
        setSubtitle(data.subtitle);
        setIsActive(data.is_active);
      });
  }, [clientId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const res = await fetch(`/api/admin/clients/${clientId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, subtitle, is_active: isActive }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to update");
    } else {
      setSuccess("Client updated successfully");
    }
    setLoading(false);
  };

  if (!client) {
    return <div className="dynamic-loading"><div className="loading-spinner" /></div>;
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1>Edit: {client.name}</h1>
          <p>Client ID: <code>{clientId}</code></p>
        </div>
        <Link
          href={`/admin/clients/${clientId}/credentials`}
          className="admin-btn"
        >
          Manage API Keys
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="admin-form">
        {error && <div className="admin-alert admin-alert--error">{error}</div>}
        {success && <div className="admin-alert admin-alert--success">{success}</div>}

        <div className="admin-form__group">
          <label className="admin-form__label" htmlFor="client-name">
            Name
          </label>
          <input
            id="client-name"
            className="admin-form__input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="admin-form__group">
          <label className="admin-form__label" htmlFor="client-subtitle">
            Subtitle
          </label>
          <input
            id="client-subtitle"
            className="admin-form__input"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            required
          />
        </div>

        <div className="admin-form__group">
          <label className="admin-form__label">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              style={{ marginRight: 8 }}
            />
            Active
          </label>
          <p className="admin-form__hint">
            Inactive clients won&apos;t appear in the client selector
          </p>
        </div>

        <div className="admin-form__actions">
          <button type="submit" className="admin-btn" disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </button>
          <Link href="/admin/clients" className="admin-btn admin-btn--secondary">
            Back to Clients
          </Link>
          <Link href={`/${clientId}`} className="admin-btn admin-btn--secondary">
            View Reports
          </Link>
        </div>
      </form>
    </div>
  );
}
