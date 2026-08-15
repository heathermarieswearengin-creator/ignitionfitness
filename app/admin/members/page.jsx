"use client";
import { useState, useEffect, useCallback } from "react";

const REASON_LABEL = {
  assigned: "Assigned",
  "manual-add": "Added by coach",
  "manual-remove": "Removed by coach",
  booking: "Used for booking",
  "cancel-refund": "Refunded on cancel",
};

export default function MembersPage() {
  const [members, setMembers] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberDetail, setMemberDetail] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [assignPick, setAssignPick] = useState("");
  const [adjust, setAdjust] = useState({ id: null, delta: "", note: "" });

  const load = useCallback(async () => {
    setLoading(true);
    const [m, c] = await Promise.all([
      fetch("/api/admin/members").then(r => r.ok ? r.json() : []).catch(() => []),
      fetch("/api/admin/packages").then(r => r.ok ? r.json() : []).catch(() => []),
    ]);
    setMembers(m);
    setCatalog(c);
    setLoading(false);
  }, []);

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
    const res = await fetch(`/api/admin/members/${id}`);
    setMemberDetail(res.ok ? await res.json() : null);
  };

  const refreshDetail = async (id) => {
    const res = await fetch(`/api/admin/members/${id}`);
    setMemberDetail(res.ok ? await res.json() : null);
    load();
  };

  const assign = async () => {
    if (!assignPick || !selectedMember || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/members/${selectedMember}/packages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: assignPick }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Could not assign package.");
      setAssignPick("");
      await refreshDetail(selectedMember);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const applyAdjust = async () => {
    const delta = Number(adjust.delta);
    if (!adjust.id || !Number.isInteger(delta) || delta === 0 || !adjust.note.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/member-packages/${adjust.id}/credits`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delta, note: adjust.note.trim() }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Could not adjust credits.");
      setAdjust({ id: null, delta: "", note: "" });
      await refreshDetail(selectedMember);
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

  return (
    <div>
      <div className="adm-page-header">
        <h1>Members</h1>
        <p>Manage members and their session packages</p>
      </div>

      {loading ? (
        <div className="adm-card">
          <div className="adm-empty">
            <div className="adm-spinner" style={{ margin: "0 auto" }} />
          </div>
        </div>
      ) : members.length === 0 ? (
        <div className="adm-card">
          <div className="adm-empty">
            <div className="adm-empty-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
              </svg>
            </div>
            <p>No members have signed up yet</p>
          </div>
        </div>
      ) : (
        <div className="adm-card">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {members.map(member => {
              const isOpen = selectedMember === member.id;
              const activePackages = member.packages?.filter(p => p.active) || [];

              return (
                <div key={member.id}>
                  <button
                    onClick={() => openMember(member.id)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: 16,
                      background: isOpen ? "#fafaf9" : "white",
                      border: `1px solid ${isOpen ? "#d6d3d1" : "#e7e5e4"}`,
                      borderRadius: 8,
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: "#f5f5f4",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 600,
                        color: "#57534e",
                      }}>
                        {member.name?.charAt(0) || "?"}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: "#1c1917" }}>{member.name}</div>
                        <div style={{ fontSize: 13, color: "#78716c" }}>{member.email}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                      {activePackages.map(p => (
                        <span key={p.id} className="adm-badge adm-badge-green">
                          {p.unlimited ? "Unlimited" : `${p.creditsRemaining} credits`}
                        </span>
                      ))}
                      {activePackages.length === 0 && (
                        <span className="adm-badge adm-badge-gray">No active package</span>
                      )}
                    </div>
                  </button>

                  {isOpen && memberDetail && (
                    <div style={{ padding: 20, background: "#fafaf9", borderRadius: "0 0 8px 8px", marginTop: -1, border: "1px solid #d6d3d1", borderTop: "none" }}>
                      {error && (
                        <div style={{ padding: 12, background: "#fef2f2", borderRadius: 8, color: "#991b1b", fontSize: 14, marginBottom: 16 }}>
                          {error}
                        </div>
                      )}

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                        {/* Assign Package */}
                        <div>
                          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: "#1c1917" }}>Assign Package</h3>
                          <div style={{ display: "flex", gap: 8 }}>
                            <select
                              className="adm-input"
                              value={assignPick}
                              onChange={e => setAssignPick(e.target.value)}
                              style={{ flex: 1 }}
                            >
                              <option value="">Select a package...</option>
                              {catalog.map(p => (
                                <option key={p.id} value={p.id}>
                                  {p.name} ({p.type === "PT" ? "PT" : "Group"})
                                </option>
                              ))}
                            </select>
                            <button
                              className="adm-btn adm-btn-primary"
                              onClick={assign}
                              disabled={!assignPick || busy}
                            >
                              Assign
                            </button>
                          </div>
                        </div>

                        {/* Adjust Credits */}
                        {memberDetail.packages?.some(p => p.active && !p.unlimited) && (
                          <div>
                            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: "#1c1917" }}>Adjust Credits</h3>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                              <select
                                className="adm-input"
                                value={adjust.id || ""}
                                onChange={e => setAdjust({ ...adjust, id: e.target.value })}
                                style={{ flex: 1, minWidth: 120 }}
                              >
                                <option value="">Select package...</option>
                                {memberDetail.packages?.filter(p => p.active && !p.unlimited).map(p => (
                                  <option key={p.id} value={p.id}>
                                    {p.type} ({p.creditsRemaining} left)
                                  </option>
                                ))}
                              </select>
                              <input
                                type="number"
                                className="adm-input"
                                placeholder="+/-"
                                value={adjust.delta}
                                onChange={e => setAdjust({ ...adjust, delta: e.target.value })}
                                style={{ width: 70 }}
                              />
                              <input
                                type="text"
                                className="adm-input"
                                placeholder="Reason"
                                value={adjust.note}
                                onChange={e => setAdjust({ ...adjust, note: e.target.value })}
                                style={{ flex: 1, minWidth: 100 }}
                              />
                              <button
                                className="adm-btn adm-btn-secondary"
                                onClick={applyAdjust}
                                disabled={!adjust.id || !adjust.delta || !adjust.note.trim() || busy}
                              >
                                Apply
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Active Packages */}
                      {memberDetail.packages?.filter(p => p.active).length > 0 && (
                        <div style={{ marginTop: 20 }}>
                          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: "#1c1917" }}>Active Packages</h3>
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {memberDetail.packages?.filter(p => p.active).map(pkg => (
                              <div key={pkg.id} style={{ padding: 12, background: "white", borderRadius: 8, border: "1px solid #e7e5e4" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                  <div>
                                    <span style={{ fontWeight: 600 }}>{pkg.type === "PT" ? "Personal Training" : "Group"}</span>
                                    {pkg.expiresAt && (
                                      <span style={{ fontSize: 13, color: "#78716c", marginLeft: 8 }}>
                                        Expires {formatDate(pkg.expiresAt)}
                                      </span>
                                    )}
                                  </div>
                                  <span className="adm-badge adm-badge-green">
                                    {pkg.unlimited ? "Unlimited" : `${pkg.creditsRemaining} credits`}
                                  </span>
                                </div>

                                {/* Credit Log */}
                                {pkg.logs?.length > 0 && (
                                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #f5f5f4" }}>
                                    <div style={{ fontSize: 12, color: "#78716c", marginBottom: 8 }}>History</div>
                                    {pkg.logs.slice(0, 5).map((log, i) => (
                                      <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0" }}>
                                        <span style={{ color: "#57534e" }}>
                                          {REASON_LABEL[log.reason] || log.reason}
                                          {log.note && ` - ${log.note}`}
                                        </span>
                                        <span style={{ color: log.delta > 0 ? "#166534" : "#991b1b", fontWeight: 500 }}>
                                          {log.delta > 0 ? "+" : ""}{log.delta}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 800px) {
          div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
