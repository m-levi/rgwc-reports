"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

function generateSlug(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default function NewClientPage() {
  const router = useRouter();
  const [id, setId] = useState(generateSlug());
  const [name, setName] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, name, subtitle }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to create client");
      setLoading(false);
      return;
    }

    router.push(`/admin/clients/${id}/credentials`);
  };

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1>New Client</h1>
          <p>Add a new client to manage their reports</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="admin-form">
        {error && <div className="admin-alert admin-alert--error">{error}</div>}

        <div className="admin-form__group">
          <label className="admin-form__label" htmlFor="client-id">
            Client ID
          </label>
          <input
            id="client-id"
            className="admin-form__input"
            value={id}
            onChange={(e) => setId(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""))}
            maxLength={12}
            required
          />
          <p className="admin-form__hint">
            Short URL slug (lowercase, no spaces). Used in URLs like /abc123/dynamic
          </p>
        </div>

        <div className="admin-form__group">
          <label className="admin-form__label" htmlFor="client-name">
            Name
          </label>
          <input
            id="client-name"
            className="admin-form__input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. RGWC Reports"
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
            placeholder="e.g. The Really Good Whisky Company"
            required
          />
        </div>

        <div className="admin-form__actions">
          <button type="submit" className="admin-btn" disabled={loading}>
            {loading ? "Creating..." : "Create Client"}
          </button>
          <Link href="/admin/clients" className="admin-btn admin-btn--secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
