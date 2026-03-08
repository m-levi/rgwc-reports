"use client";

import { useState, useEffect } from "react";

interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at: string;
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Invite form
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("viewer");
  const [inviting, setInviting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  const fetchMembers = async () => {
    const res = await fetch("/api/admin/team");
    const data = await res.json();
    setMembers(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    setMessage("");

    const res = await fetch("/api/admin/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name, password, role }),
    });

    if (res.ok) {
      setMessage("Team member added successfully");
      setMessageType("success");
      setEmail("");
      setName("");
      setPassword("");
      setRole("viewer");
      setShowForm(false);
      fetchMembers();
    } else {
      const data = await res.json();
      setMessage(data.error || "Failed to add team member");
      setMessageType("error");
    }
    setInviting(false);
  };

  const updateRole = async (userId: string, newRole: string) => {
    const res = await fetch(`/api/admin/team/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });

    if (res.ok) {
      setMembers((prev) =>
        prev.map((m) => (m.id === userId ? { ...m, role: newRole } : m))
      );
    }
  };

  if (loading) {
    return <div className="dynamic-loading"><div className="loading-spinner" /></div>;
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1>Team</h1>
          <p>{members.length} member{members.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          className="admin-btn"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Cancel" : "+ Add Member"}
        </button>
      </div>

      {message && (
        <div className={`admin-alert admin-alert--${messageType}`}>
          {message}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleInvite} className="admin-form" style={{ marginBottom: 24 }}>
          <div className="credential-card">
            <h3 className="credential-card__title" style={{ marginBottom: 16 }}>
              Add Team Member
            </h3>
            <div className="credential-card__fields">
              <div className="admin-form__group" style={{ marginBottom: 0 }}>
                <label className="admin-form__label">Email</label>
                <input
                  className="admin-form__input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="team@company.com"
                  required
                />
              </div>
              <div className="admin-form__group" style={{ marginBottom: 0 }}>
                <label className="admin-form__label">Name</label>
                <input
                  className="admin-form__input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name"
                  required
                />
              </div>
              <div className="admin-form__group" style={{ marginBottom: 0 }}>
                <label className="admin-form__label">Password</label>
                <input
                  className="admin-form__input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Initial password"
                  minLength={8}
                  required
                />
              </div>
              <div className="admin-form__group" style={{ marginBottom: 0 }}>
                <label className="admin-form__label">Role</label>
                <select
                  className="admin-form__input"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="viewer">Viewer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <button type="submit" className="admin-btn" disabled={inviting}>
              {inviting ? "Adding..." : "Add Member"}
            </button>
          </div>
        </form>
      )}

      <table className="admin-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Joined</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={member.id}>
              <td><strong>{member.name}</strong></td>
              <td>{member.email}</td>
              <td>
                <span
                  className={`status-badge ${
                    member.role === "admin"
                      ? "status-badge--active"
                      : "status-badge--inactive"
                  }`}
                >
                  {member.role}
                </span>
              </td>
              <td style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                {new Date(member.created_at).toLocaleDateString()}
              </td>
              <td>
                <button
                  className="admin-btn admin-btn--secondary admin-btn--small"
                  onClick={() =>
                    updateRole(
                      member.id,
                      member.role === "admin" ? "viewer" : "admin"
                    )
                  }
                >
                  {member.role === "admin" ? "Demote" : "Promote"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
