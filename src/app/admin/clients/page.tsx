import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

interface ClientRow {
  id: string;
  name: string;
  subtitle: string;
  is_active: boolean;
  credentials: { provider: string }[];
}

export default async function ClientsListPage() {
  const supabase = await createClient();

  const { data: clients } = await supabase
    .from("clients")
    .select("id, name, subtitle, is_active")
    .order("name");

  // Get credential status for each client
  const { data: credentials } = await supabase
    .from("client_credentials")
    .select("client_id, provider");

  const credMap = new Map<string, Set<string>>();
  credentials?.forEach((c) => {
    if (!credMap.has(c.client_id)) credMap.set(c.client_id, new Set());
    credMap.get(c.client_id)!.add(c.provider);
  });

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1>Clients</h1>
          <p>{clients?.length || 0} client{(clients?.length || 0) !== 1 ? "s" : ""}</p>
        </div>
        <Link href="/admin/clients/new" className="admin-btn">
          + Add Client
        </Link>
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>ID</th>
            <th>Status</th>
            <th>Shopify</th>
            <th>Klaviyo</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {clients?.map((client) => {
            const creds = credMap.get(client.id);
            return (
              <tr key={client.id}>
                <td>
                  <strong>{client.name}</strong>
                  <br />
                  <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                    {client.subtitle}
                  </span>
                </td>
                <td>
                  <code style={{ fontSize: "0.8rem" }}>{client.id}</code>
                </td>
                <td>
                  <span
                    className={`status-badge ${
                      client.is_active
                        ? "status-badge--active"
                        : "status-badge--inactive"
                    }`}
                  >
                    {client.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td>
                  <span
                    className={`status-dot ${
                      creds?.has("shopify")
                        ? "status-dot--connected"
                        : "status-dot--missing"
                    }`}
                  />
                </td>
                <td>
                  <span
                    className={`status-dot ${
                      creds?.has("klaviyo")
                        ? "status-dot--connected"
                        : "status-dot--missing"
                    }`}
                  />
                </td>
                <td>
                  <Link
                    href={`/admin/clients/${client.id}`}
                    className="admin-btn admin-btn--secondary admin-btn--small"
                  >
                    Manage
                  </Link>
                </td>
              </tr>
            );
          })}
          {(!clients || clients.length === 0) && (
            <tr>
              <td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                No clients yet. Add your first client to get started.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
