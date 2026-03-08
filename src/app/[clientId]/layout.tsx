import Link from "next/link";
import { getClient } from "@/lib/clients";
import { getCurrentUser } from "@/lib/auth";
import { notFound } from "next/navigation";
import { LogoutButton } from "./logout-button";

export default async function ClientLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const client = await getClient(clientId);
  if (!client) notFound();

  const user = await getCurrentUser();

  return (
    <>
      <header className="site-header">
        <Link href={`/${clientId}`} className="site-header__logo">
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
          {client.name}
        </Link>
        <div className="site-header__divider" />
        <span className="site-header__subtitle">{client.subtitle}</span>
        <div className="site-header__right">
          {user && (
            <>
              <span className="site-header__user">{user.name}</span>
              {user.role === "admin" && (
                <Link href="/admin" className="site-header__link">
                  Admin
                </Link>
              )}
              <Link href="/" className="site-header__link">
                All Clients
              </Link>
              <LogoutButton />
            </>
          )}
        </div>
      </header>
      <main>{children}</main>
    </>
  );
}
