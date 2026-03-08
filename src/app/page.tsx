import Link from "next/link";
import { getAllClients } from "@/lib/clients";
import { getCurrentUser } from "@/lib/auth";
import { LogoutButton } from "./[clientId]/logout-button";

export default async function Home() {
  const user = await getCurrentUser();
  const clients = await getAllClients();

  return (
    <>
      <header className="site-header">
        <Link href="/" className="site-header__logo">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          Reports Dashboard
        </Link>
        <div className="site-header__right">
          {user && (
            <>
              <span className="site-header__user">{user.name}</span>
              {user.role === "admin" && (
                <Link href="/admin" className="site-header__link">
                  Admin
                </Link>
              )}
              <LogoutButton />
            </>
          )}
        </div>
      </header>

      <div className="client-selector">
        <div className="client-selector__header">
          <h1>Select a Client</h1>
          <p>Choose a client to view their reports</p>
        </div>

        <div className="client-grid">
          {clients.map((client) => (
            <Link
              key={client.id}
              href={`/${client.id}`}
              className="client-card"
            >
              <div className="client-card__name">{client.name}</div>
              <div className="client-card__subtitle">{client.subtitle}</div>
            </Link>
          ))}
        </div>

        {clients.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-muted)" }}>
            <p>No clients configured yet.</p>
            {user?.role === "admin" && (
              <Link href="/admin/clients/new" className="admin-btn" style={{ marginTop: 16, display: "inline-flex" }}>
                Add Your First Client
              </Link>
            )}
          </div>
        )}
      </div>
    </>
  );
}
