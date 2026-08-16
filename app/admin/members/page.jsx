"use client";
import { useState, useEffect, useCallback, useRef } from "react";

export default function MembersPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberDetail, setMemberDetail] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleteEmailInput, setDeleteEmailInput] = useState("");
  const [menuOpen, setMenuOpen] = useState(null);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const url = showArchived ? "/api/admin/members?includeArchived=true" : "/api/admin/members";
    const res = await fetch(url).catch(() => null);
    setMembers(res?.ok ? await res.json() : []);
    setLoading(false);
  }, [showArchived]);

  useEffect(() => { load(); }, [load]);

  const openMember = async (id) => {
    if (selectedMember === id) {
      setSelectedMember(null);
      setMemberDetail(null);
      return;
    }
    setSelectedMember(id);
    setMemberDetail(null);
    setError(null);
    setMenuOpen(null);
    const res = await fetch("/api/admin/members/" + id);
    setMemberDetail(res.ok ? await res.json() : null);
  };

  const archiveMember = async (id, archive) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/members/" + id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: archive }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Could not update member.");
      }
      setConfirmArchive(null);
      setSelectedMember(null);
      setMemberDetail(null);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const deleteMember = async (id) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/members/" + id, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Could not delete member.");
      }
      setConfirmDelete(null);
      setSelectedMember(null);
      setMemberDetail(null);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const formatDate = (ts) => {
    const d = new Date(ts);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const activeCount = members.filter(m => !m.archived).length;
  const archivedCount = members.filter(m => m.archived).length;

  const statusBadgeClass = (status) => {
    switch (status) {
      case "confirmed": return "adm-badge-green";
      case "completed": return "adm-badge-gray";
      case "pending": return "adm-badge-yellow";
      case "cancelled": return "adm-badge-red";
      default: return "adm-badge-gray";
    }
  };

  return (
    <div>
      <div className="adm-page-header">
        <h1>Members</h1>
        <p>View member details and session history</p>
      </div>

      <div className="adm-card">
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <button
            className={"adm-filter-btn " + (showArchived ? "" : "active")}
            onClick={() => setShowArchived(false)}
          >
            Active ({activeCount})
          </button>
          <button
            className={"adm-filter-btn " + (showArchived ? "active" : "")}
            onClick={() => setShowArchived(true)}
          >
            All ({activeCount + archivedCount})
          </button>
        </div>

        {loading ? (
          <div className="adm-empty">
            <div className="adm-spinner" style={{ margin: "0 auto" }} />
          </div>
        ) : members.length === 0 ? (
          <div className="adm-empty">
            <p>No members found</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {members.map(member => (
              <div key={member.id}>
                {/* Member Row Header */}
                <div
                  onClick={() => openMember(member.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "16px 18px",
                    background: selectedMember === member.id ? "#fafaf9" : "white",
                    border: "1px solid #e7e5e4",
                    borderRadius: selectedMember === member.id ? "10px 10px 0 0" : 10,
                    cursor: "pointer",
                    opacity: member.archived ? 0.6 : 1,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontWeight: 700,
                      fontSize: 16,
                      color: "#1c1917",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 3,
                    }}>
                      {member.name}
                      {member.archived && (
                        <span className="adm-badge adm-badge-gray" style={{ fontSize: 11 }}>Archived</span>
                      )}
                    </div>
                    <div style={{ fontSize: 13, color: "#78716c" }}>{member.email}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
                    <span style={{
                      fontSize: 13,
                      color: "#57534e",
                      background: "#f5f5f4",
                      padding: "4px 10px",
                      borderRadius: 6,
                    }}>
                      {member.bookingCount} session{member.bookingCount !== 1 ? "s" : ""}
                    </span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a8a29e" strokeWidth="2"
                      style={{ transform: selectedMember === member.id ? "rotate(180deg)" : "none", transition: ".2s" }}>
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </div>
                </div>

                {/* Expanded Detail Panel */}
                {selectedMember === member.id && (
                  <div style={{
                    padding: "20px 18px 24px",
                    background: "#fafaf9",
                    border: "1px solid #e7e5e4",
                    borderTop: "none",
                    borderRadius: "0 0 10px 10px",
                  }}>
                    {!memberDetail ? (
                      <div className="adm-spinner" style={{ margin: "30px auto" }} />
                    ) : (
                      <>
                        {error && (
                          <div style={{
                            padding: 14,
                            background: "#fef2f2",
                            borderRadius: 8,
                            color: "#991b1b",
                            marginBottom: 20,
                            fontSize: 14
                          }}>
                            {error}
                          </div>
                        )}

                        {/* SECTION: Contact Info */}
                        <div style={{
                          background: "white",
                          border: "1px solid #e7e5e4",
                          borderRadius: 10,
                          padding: "16px 18px",
                          marginBottom: 20,
                        }}>
                          <div style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: "#a8a29e",
                            textTransform: "uppercase",
                            letterSpacing: ".05em",
                            marginBottom: 12,
                          }}>
                            Contact
                          </div>
                          <div style={{ fontSize: 15, fontWeight: 500, color: "#1c1917", marginBottom: 6 }}>
                            {memberDetail.email}
                          </div>
                          {memberDetail.phone && (
                            <div style={{ fontSize: 14, color: "#57534e", marginBottom: 6 }}>
                              {memberDetail.phone}
                            </div>
                          )}
                          <div style={{ fontSize: 13, color: "#a8a29e" }}>
                            Joined {formatDate(memberDetail.createdAt)}
                          </div>
                        </div>

                        {/* SECTION: Manage Member (overflow menu) */}
                        <div style={{
                          display: "flex",
                          justifyContent: "flex-end",
                          marginBottom: 24,
                          position: "relative",
                        }} ref={menuRef}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setMenuOpen(menuOpen === member.id ? null : member.id);
                            }}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              padding: "8px 14px",
                              background: "white",
                              border: "1px solid #e7e5e4",
                              borderRadius: 8,
                              fontSize: 13,
                              color: "#57534e",
                              cursor: "pointer",
                            }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="1" />
                              <circle cx="12" cy="5" r="1" />
                              <circle cx="12" cy="19" r="1" />
                            </svg>
                            Manage member
                          </button>

                          {/* Dropdown Menu */}
                          {menuOpen === member.id && (
                            <div style={{
                              position: "absolute",
                              top: "100%",
                              right: 0,
                              marginTop: 4,
                              background: "white",
                              border: "1px solid #e7e5e4",
                              borderRadius: 10,
                              boxShadow: "0 4px 12px rgba(0,0,0,.1)",
                              minWidth: 180,
                              zIndex: 100,
                              overflow: "hidden",
                            }}>
                              {memberDetail.archived ? (
                                <button
                                  onClick={() => {
                                    setMenuOpen(null);
                                    setConfirmArchive({ id: member.id, name: memberDetail.name, restore: true });
                                  }}
                                  style={{
                                    width: "100%",
                                    padding: "12px 16px",
                                    background: "none",
                                    border: "none",
                                    textAlign: "left",
                                    fontSize: 14,
                                    color: "#1c1917",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                  }}
                                  onMouseEnter={(e) => e.target.style.background = "#f5f5f4"}
                                  onMouseLeave={(e) => e.target.style.background = "none"}
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8" />
                                    <path d="M3 3v5h5" />
                                  </svg>
                                  Restore member
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setMenuOpen(null);
                                    setConfirmArchive({ id: member.id, name: memberDetail.name, restore: false });
                                  }}
                                  style={{
                                    width: "100%",
                                    padding: "12px 16px",
                                    background: "none",
                                    border: "none",
                                    textAlign: "left",
                                    fontSize: 14,
                                    color: "#1c1917",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                  }}
                                  onMouseEnter={(e) => e.target.style.background = "#f5f5f4"}
                                  onMouseLeave={(e) => e.target.style.background = "none"}
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 8v13H3V8M1 3h22v5H1z" />
                                    <path d="M10 12h4" />
                                  </svg>
                                  Archive member
                                </button>
                              )}
                              <div style={{ height: 1, background: "#e7e5e4" }} />
                              <button
                                onClick={() => {
                                  setMenuOpen(null);
                                  setDeleteEmailInput("");
                                  setConfirmDelete({ id: member.id, name: memberDetail.name, email: memberDetail.email });
                                }}
                                style={{
                                  width: "100%",
                                  padding: "12px 16px",
                                  background: "none",
                                  border: "none",
                                  textAlign: "left",
                                  fontSize: 14,
                                  color: "#991b1b",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 10,
                                }}
                                onMouseEnter={(e) => e.target.style.background = "#fef2f2"}
                                onMouseLeave={(e) => e.target.style.background = "none"}
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                                </svg>
                                Delete permanently
                              </button>
                            </div>
                          )}
                        </div>

                        {/* SECTION: Recent Sessions */}
                        <div>
                          <div style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: "#a8a29e",
                            textTransform: "uppercase",
                            letterSpacing: ".05em",
                            marginBottom: 12,
                          }}>
                            Recent Sessions ({memberDetail.bookingCount} total)
                          </div>
                          {memberDetail.recentBookings?.length === 0 ? (
                            <div style={{
                              color: "#78716c",
                              fontSize: 14,
                              padding: "20px",
                              textAlign: "center",
                              background: "white",
                              border: "1px solid #e7e5e4",
                              borderRadius: 10,
                            }}>
                              No sessions yet
                            </div>
                          ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                              {memberDetail.recentBookings?.slice(0, 10).map(b => (
                                <div key={b.id} style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  padding: "14px 16px",
                                  background: "white",
                                  borderRadius: 10,
                                  border: "1px solid #e7e5e4",
                                  borderLeft: `4px solid ${b.classType === "pt" ? "#a855f7" : "#22c55e"}`,
                                }}>
                                  <div>
                                    <div style={{ fontSize: 14, fontWeight: 600, color: "#1c1917", marginBottom: 3 }}>
                                      {b.classType === "pt" ? "Personal Training" : "Group Class"}
                                    </div>
                                    <div style={{ fontSize: 13, color: "#78716c" }}>
                                      {b.date} · {b.time}
                                    </div>
                                  </div>
                                  <span className={"adm-badge " + statusBadgeClass(b.status)}>
                                    {b.status}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Archive Confirmation Modal */}
      {confirmArchive && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: 16,
        }} onClick={() => { setConfirmArchive(null); setError(null); }}>
          <div
            className="adm-card"
            style={{ maxWidth: 400, width: "100%" }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: 12, fontSize: 18 }}>
              {confirmArchive.restore ? "Restore" : "Archive"} {confirmArchive.name}?
            </h3>
            <p style={{ color: "#78716c", marginBottom: 20, fontSize: 14, lineHeight: 1.6 }}>
              {confirmArchive.restore
                ? "This will restore their account. They'll be able to log in and book new sessions again."
                : "They won't be able to log in or book new sessions until restored. Their session history will be preserved."
              }
            </p>
            {error && (
              <div style={{ padding: 12, background: "#fef2f2", borderRadius: 6, color: "#991b1b", marginBottom: 16, fontSize: 14 }}>
                {error}
              </div>
            )}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                className="adm-btn adm-btn-secondary"
                onClick={() => { setConfirmArchive(null); setError(null); }}
                style={{ minHeight: 40 }}
              >
                Cancel
              </button>
              <button
                className="adm-btn adm-btn-primary"
                onClick={() => archiveMember(confirmArchive.id, !confirmArchive.restore)}
                disabled={busy}
                style={{ minHeight: 40 }}
              >
                {busy ? "..." : confirmArchive.restore ? "Restore" : "Archive"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal - Type email to confirm */}
      {confirmDelete && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: 16,
        }} onClick={() => { setConfirmDelete(null); setDeleteEmailInput(""); setError(null); }}>
          <div
            className="adm-card"
            style={{ maxWidth: 440, width: "100%" }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: "#fef2f2", color: "#991b1b",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                </svg>
              </div>
              <h3 style={{ margin: 0, fontSize: 18, color: "#991b1b" }}>
                Permanently Delete Member
              </h3>
            </div>

            <div style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: 8,
              padding: 14,
              marginBottom: 16,
              fontSize: 14,
              color: "#991b1b",
              lineHeight: 1.5
            }}>
              <strong>This will permanently delete:</strong>
              <ul style={{ margin: "8px 0 0", paddingLeft: 20 }}>
                <li>The member account for <strong>{confirmDelete.name}</strong></li>
                <li>All their booking history (past, upcoming, cancelled)</li>
                <li>Any upcoming bookings will free their reserved slots</li>
              </ul>
              <div style={{ marginTop: 10, fontWeight: 600 }}>
                This cannot be undone.
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{
                display: "block",
                fontSize: 13,
                fontWeight: 500,
                color: "#44403c",
                marginBottom: 6
              }}>
                Type <strong style={{ fontFamily: "monospace", background: "#f5f5f4", padding: "2px 6px", borderRadius: 4 }}>{confirmDelete.email}</strong> to confirm:
              </label>
              <input
                type="email"
                value={deleteEmailInput}
                onChange={e => setDeleteEmailInput(e.target.value)}
                placeholder="member@example.com"
                autoComplete="off"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #e7e5e4",
                  borderRadius: 8,
                  fontSize: 14,
                  fontFamily: "monospace",
                }}
              />
            </div>

            {error && (
              <div style={{ padding: 12, background: "#fef2f2", borderRadius: 6, color: "#991b1b", marginBottom: 16, fontSize: 14 }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                className="adm-btn adm-btn-secondary"
                onClick={() => { setConfirmDelete(null); setDeleteEmailInput(""); setError(null); }}
                style={{ minHeight: 40 }}
              >
                Cancel
              </button>
              <button
                className="adm-btn"
                onClick={() => deleteMember(confirmDelete.id)}
                disabled={busy || deleteEmailInput.toLowerCase() !== confirmDelete.email.toLowerCase()}
                style={{
                  minHeight: 40,
                  background: deleteEmailInput.toLowerCase() === confirmDelete.email.toLowerCase() ? "#991b1b" : "#d1d5db",
                  color: "white",
                  border: "none",
                  cursor: deleteEmailInput.toLowerCase() === confirmDelete.email.toLowerCase() ? "pointer" : "not-allowed",
                }}
              >
                {busy ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
