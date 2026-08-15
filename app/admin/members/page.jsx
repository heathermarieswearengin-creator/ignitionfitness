"use client";
import { useState, useEffect, useCallback } from "react";

export default function MembersPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberDetail, setMemberDetail] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

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
      setConfirmDelete(null);
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
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {members.map(member => (
              <div key={member.id}>
                <div
                  onClick={() => openMember(member.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 16px",
                    background: selectedMember === member.id ? "#fafaf9" : "white",
                    border: "1px solid #e7e5e4",
                    borderRadius: selectedMember === member.id ? "8px 8px 0 0" : 8,
                    cursor: "pointer",
                    opacity: member.archived ? 0.6 : 1,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: "#1c1917", display: "flex", alignItems: "center", gap: 8 }}>
                      {member.name}
                      {member.archived && (
                        <span className="adm-badge adm-badge-gray">Archived</span>
                      )}
                    </div>
                    <div style={{ fontSize: 13, color: "#78716c" }}>{member.email}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 13, color: "#78716c" }}>
                      {member.bookingCount} session{member.bookingCount !== 1 ? "s" : ""}
                    </span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a8a29e" strokeWidth="2"
                      style={{ transform: selectedMember === member.id ? "rotate(180deg)" : "none", transition: ".2s" }}>
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </div>
                </div>

                {selectedMember === member.id && (
                  <div style={{
                    padding: 16,
                    background: "#fafaf9",
                    border: "1px solid #e7e5e4",
                    borderTop: "none",
                    borderRadius: "0 0 8px 8px",
                  }}>
                    {!memberDetail ? (
                      <div className="adm-spinner" style={{ margin: "20px auto" }} />
                    ) : (
                      <>
                        {error && (
                          <div style={{ padding: 12, background: "#fef2f2", borderRadius: 6, color: "#991b1b", marginBottom: 16, fontSize: 14 }}>
                            {error}
                          </div>
                        )}

                        <div style={{ marginBottom: 20 }}>
                          <div style={{ fontSize: 13, color: "#78716c", marginBottom: 4 }}>Contact</div>
                          <div style={{ fontWeight: 500 }}>{memberDetail.email}</div>
                          {memberDetail.phone && <div style={{ color: "#78716c" }}>{memberDetail.phone}</div>}
                          <div style={{ fontSize: 12, color: "#a8a29e", marginTop: 4 }}>
                            Joined {formatDate(memberDetail.createdAt)}
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
                          {memberDetail.archived ? (
                            <button
                              className="adm-btn adm-btn-secondary"
                              onClick={() => archiveMember(member.id, false)}
                              disabled={busy}
                              style={{ minHeight: 40 }}
                            >
                              {busy ? "..." : "Restore Member"}
                            </button>
                          ) : (
                            <button
                              className="adm-btn adm-btn-secondary"
                              onClick={() => archiveMember(member.id, true)}
                              disabled={busy}
                              style={{ minHeight: 40 }}
                            >
                              {busy ? "..." : "Archive Member"}
                            </button>
                          )}
                          <button
                            className="adm-btn"
                            onClick={() => setConfirmDelete(member.id)}
                            disabled={busy}
                            style={{
                              minHeight: 40,
                              background: "#fef2f2",
                              color: "#991b1b",
                              border: "1px solid #fecaca"
                            }}
                          >
                            Delete...
                          </button>
                        </div>

                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
                            Recent Sessions ({memberDetail.bookingCount} total)
                          </div>
                          {memberDetail.recentBookings?.length === 0 ? (
                            <div style={{ color: "#78716c", fontSize: 14 }}>No sessions yet</div>
                          ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                              {memberDetail.recentBookings?.slice(0, 10).map(b => (
                                <div key={b.id} style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  padding: "10px 12px",
                                  background: "white",
                                  borderRadius: 6,
                                  border: "1px solid #e7e5e4",
                                }}>
                                  <div>
                                    <div style={{ fontSize: 13, fontWeight: 500 }}>
                                      {b.classType === "pt" ? "Personal Training" : "Group Class"}
                                    </div>
                                    <div style={{ fontSize: 12, color: "#78716c" }}>
                                      {b.date} · {b.time}
                                    </div>
                                  </div>
                                  <span className={"adm-badge " + (
                                    b.status === "confirmed" ? "adm-badge-green" :
                                    b.status === "cancelled" ? "adm-badge-red" :
                                    "adm-badge-gray"
                                  )}>
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
        }} onClick={() => setConfirmDelete(null)}>
          <div
            className="adm-card"
            style={{ maxWidth: 400, width: "100%" }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: 12, fontSize: 18 }}>Delete Member?</h3>
            <p style={{ color: "#78716c", marginBottom: 20, fontSize: 14, lineHeight: 1.5 }}>
              This permanently removes their account and cannot be undone. Members with booking history cannot be deleted — archive them instead.
            </p>
            {error && (
              <div style={{ padding: 12, background: "#fef2f2", borderRadius: 6, color: "#991b1b", marginBottom: 16, fontSize: 14 }}>
                {error}
              </div>
            )}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                className="adm-btn adm-btn-secondary"
                onClick={() => { setConfirmDelete(null); setError(null); }}
                style={{ minHeight: 40 }}
              >
                Cancel
              </button>
              <button
                className="adm-btn"
                onClick={() => deleteMember(confirmDelete)}
                disabled={busy}
                style={{
                  minHeight: 40,
                  background: "#991b1b",
                  color: "white",
                  border: "none"
                }}
              >
                {busy ? "Deleting..." : "Delete Member"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
