"use client";
import { useState, useEffect, useCallback } from "react";

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [breakpoint]);
  return isMobile;
}

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "converted", label: "Converted" },
  { value: "dead", label: "Dead" },
];

const STATUS_COLORS = {
  new: "adm-badge-yellow",
  contacted: "adm-badge-gray",
  converted: "adm-badge-green",
  dead: "adm-badge-red",
};

function Icon({ name, size = 20 }) {
  const icons = {
    check: <polyline points="20 6 9 17 4 12" />,
    x: <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>,
    info: <><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></>,
    userPlus: <><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></>,
    mail: <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {icons[name]}
    </svg>
  );
}

// Toast notification component
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 6000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === "success" ? "#dcfce7" : type === "error" ? "#fee2e2" : "#fef3c7";
  const borderColor = type === "success" ? "#86efac" : type === "error" ? "#fca5a5" : "#fcd34d";
  const textColor = type === "success" ? "#166534" : type === "error" ? "#991b1b" : "#92400e";
  const icon = type === "success" ? "check" : type === "error" ? "x" : "info";

  return (
    <div style={{
      position: "fixed",
      bottom: 24,
      right: 24,
      zIndex: 9999,
      display: "flex",
      alignItems: "flex-start",
      gap: 12,
      padding: "16px 20px",
      background: bgColor,
      border: `1px solid ${borderColor}`,
      borderRadius: 12,
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      maxWidth: 400,
      animation: "slideIn 0.3s ease-out",
    }}>
      <div style={{ color: textColor, flexShrink: 0, marginTop: 2 }}>
        <Icon name={icon} size={20} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ color: textColor, fontSize: 14, fontWeight: 500, lineHeight: 1.5 }}>
          {message}
        </div>
      </div>
      <button
        onClick={onClose}
        style={{
          background: "none",
          border: "none",
          padding: 4,
          cursor: "pointer",
          color: textColor,
          opacity: 0.7,
        }}
      >
        <Icon name="x" size={16} />
      </button>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// Convert to Member confirmation modal
function ConvertModal({ lead, onClose, onSuccess }) {
  const [state, setState] = useState("confirm"); // confirm | loading | success | error
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const handleConvert = async () => {
    setState("loading");
    setErrorMsg("");

    try {
      const res = await fetch(`/api/leads/${lead.id}/convert`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Failed to convert lead");
        setState("error");
        return;
      }

      setResult(data);
      setState("success");
      // Notify parent after a brief delay so user can see success state
      setTimeout(() => onSuccess(data), 1500);
    } catch (err) {
      console.error("Convert error:", err);
      setErrorMsg("Network error. Please try again.");
      setState("error");
    }
  };

  const modalStyle = {
    position: "fixed",
    inset: 0,
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  };

  const overlayStyle = {
    position: "absolute",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
  };

  const contentStyle = {
    position: "relative",
    background: "white",
    borderRadius: 12,
    padding: 24,
    maxWidth: 440,
    width: "100%",
    boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
  };

  const buttonBase = {
    padding: "10px 20px",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    border: "none",
    transition: "opacity 0.15s",
  };

  return (
    <div style={modalStyle}>
      <div style={overlayStyle} onClick={state === "loading" ? undefined : onClose} />
      <div style={contentStyle}>
        {state === "confirm" && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: "#c9251c", color: "white",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <Icon name="userPlus" size={20} />
              </div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "#1c1917" }}>
                Convert to Member
              </h2>
            </div>

            <div style={{
              background: "#f5f5f4", borderRadius: 8, padding: 14, marginBottom: 20
            }}>
              <div style={{ fontWeight: 500, color: "#1c1917", marginBottom: 4 }}>
                {lead.name || "Unnamed Lead"}
              </div>
              <div style={{ fontSize: 14, color: "#78716c" }}>{lead.email}</div>
            </div>

            <div style={{ fontSize: 14, color: "#44403c", lineHeight: 1.6, marginBottom: 20 }}>
              This will:
              <ul style={{ margin: "8px 0 0", paddingLeft: 20 }}>
                <li>Create a member account for this email</li>
                <li>Send them a password setup email</li>
                <li>Link any guest bookings to their account</li>
              </ul>
            </div>

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button
                onClick={onClose}
                style={{ ...buttonBase, background: "#f5f5f4", color: "#44403c" }}
              >
                Cancel
              </button>
              <button
                onClick={handleConvert}
                style={{ ...buttonBase, background: "#c9251c", color: "white" }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Icon name="mail" size={16} />
                  Send Setup Email
                </span>
              </button>
            </div>
          </>
        )}

        {state === "loading" && (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div className="adm-spinner" style={{ margin: "0 auto 16px", width: 32, height: 32 }} />
            <div style={{ fontSize: 15, color: "#44403c" }}>
              Creating account and sending email...
            </div>
          </div>
        )}

        {state === "success" && (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{
              width: 48, height: 48, borderRadius: "50%",
              background: "#dcfce7", color: "#166534",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px"
            }}>
              <Icon name="check" size={24} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 500, color: "#166534", marginBottom: 8 }}>
              {result?.alreadyHadAccount
                ? "Already a Member"
                : result?.setPasswordEmailSent
                  ? "Success!"
                  : "Account Created"}
            </div>
            <div style={{ fontSize: 14, color: "#44403c", lineHeight: 1.5 }}>
              {result?.alreadyHadAccount ? (
                <>
                  {lead.name || lead.email} already has an account.
                  {result.adoptedBookings > 0 && (
                    <> Linked {result.adoptedBookings} guest booking{result.adoptedBookings > 1 ? "s" : ""}.</>
                  )}
                </>
              ) : result?.setPasswordEmailSent ? (
                <>
                  Account created for {lead.name || lead.email}.
                  <br />Password setup email sent!
                  {result.adoptedBookings > 0 && (
                    <> {result.adoptedBookings} guest booking{result.adoptedBookings > 1 ? "s" : ""} linked.</>
                  )}
                </>
              ) : (
                <>
                  Account created, but email failed to send.
                  <br />They&apos;ll need a manual password reset.
                </>
              )}
            </div>
          </div>
        )}

        {state === "error" && (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{
              width: 48, height: 48, borderRadius: "50%",
              background: "#fee2e2", color: "#991b1b",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px"
            }}>
              <Icon name="x" size={24} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 500, color: "#991b1b", marginBottom: 8 }}>
              Conversion Failed
            </div>
            <div style={{ fontSize: 14, color: "#44403c", marginBottom: 20 }}>
              {errorMsg}
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button
                onClick={onClose}
                style={{ ...buttonBase, background: "#f5f5f4", color: "#44403c" }}
              >
                Close
              </button>
              <button
                onClick={handleConvert}
                style={{ ...buttonBase, background: "#c9251c", color: "white" }}
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LeadsPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [updating, setUpdating] = useState(null);
  const [toast, setToast] = useState(null);
  const [convertingLead, setConvertingLead] = useState(null);
  const isMobile = useIsMobile();

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/leads").catch(() => null);
    setLeads(res?.ok ? await res.json() : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id, newStatus) => {
    setUpdating(id);
    try {
      const res = await fetch(`/api/admin/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setLeads(prev => prev.map(l => l.id === id ? { ...l, status: newStatus } : l));
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || "Failed to update status", "error");
      }
    } catch (err) {
      showToast("Failed to update status", "error");
    } finally {
      setUpdating(null);
    }
  };

  const handleConversionSuccess = (lead, result) => {
    // Update local state - the lead is now converted
    setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: "converted" } : l));
    setConvertingLead(null);

    // Show appropriate toast
    if (result.alreadyHadAccount) {
      showToast(`${lead.name || lead.email} was already a member`, "info");
    } else if (result.setPasswordEmailSent) {
      showToast(`${lead.name || lead.email} converted! Setup email sent.`, "success");
    } else {
      showToast(`Account created but email failed. Manual reset needed.`, "warning");
    }
  };

  const filtered = leads.filter(l => statusFilter === "all" || l.status === statusFilter);

  const formatDate = (ts) => {
    const d = new Date(ts);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const newCount = leads.filter(l => l.status === "new").length;

  return (
    <div>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {convertingLead && (
        <ConvertModal
          lead={convertingLead}
          onClose={() => setConvertingLead(null)}
          onSuccess={(result) => handleConversionSuccess(convertingLead, result)}
        />
      )}

      <div className="adm-page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1>Leads</h1>
          <p>Track and manage potential members</p>
        </div>
        {newCount > 0 && (
          <div className="adm-badge adm-badge-yellow" style={{ padding: "8px 14px", fontSize: 14 }}>
            {newCount} new {newCount === 1 ? "lead" : "leads"}
          </div>
        )}
      </div>

      <div className="adm-card">
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4, marginBottom: 20 }}>
          {STATUS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              className={`adm-filter-btn ${statusFilter === opt.value ? "active" : ""}`}
              onClick={() => setStatusFilter(opt.value)}
              style={{ flexShrink: 0, minHeight: 44 }}
            >
              {opt.label}
              {opt.value !== "all" && (
                <span style={{ marginLeft: 6, opacity: 0.7 }}>
                  ({leads.filter(l => l.status === opt.value).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="adm-empty">
            <div className="adm-spinner" style={{ margin: "0 auto" }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="adm-empty">
            <div className="adm-empty-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 12h-6l-2 3H10l-2-3H2" />
                <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />
              </svg>
            </div>
            <p>
              {statusFilter === "all"
                ? "No leads yet. They'll appear here when visitors express interest."
                : `No ${statusFilter} leads`}
            </p>
          </div>
        ) : isMobile ? (
          /* Mobile: Card layout */
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filtered.map(lead => (
              <div
                key={lead.id}
                style={{
                  padding: 16,
                  background: "white",
                  border: "1px solid #e7e5e4",
                  borderRadius: 10,
                  borderLeft: `4px solid ${lead.status === "new" ? "#f59e0b" : lead.status === "converted" ? "#22c55e" : lead.status === "dead" ? "#ef4444" : "#a8a29e"}`,
                }}
              >
                {/* Top row: Name + Status */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 15, color: "#1c1917", marginBottom: 2 }}>
                      {lead.name || "—"}
                    </div>
                    <div style={{ fontSize: 13, color: "#78716c", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {lead.email}
                    </div>
                  </div>
                  <span className={`adm-badge ${STATUS_COLORS[lead.status] || "adm-badge-gray"}`} style={{ flexShrink: 0, marginLeft: 8 }}>
                    {lead.status}
                  </span>
                </div>

                {/* Info row */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12, fontSize: 13, color: "#57534e" }}>
                  {lead.phone && <span>{lead.phone}</span>}
                  {lead.phone && <span style={{ color: "#a8a29e" }}>·</span>}
                  <span className="adm-badge adm-badge-gray" style={{ fontSize: 11 }}>{lead.source}</span>
                  <span style={{ color: "#a8a29e" }}>·</span>
                  <span style={{ color: "#78716c" }}>{formatDate(lead.createdAt)}</span>
                </div>

                {/* Actions row */}
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  {lead.status === "converted" ? (
                    <span style={{ fontSize: 13, color: "#166534", fontWeight: 500 }}>✓ Converted to Member</span>
                  ) : (
                    <>
                      <select
                        value={lead.status}
                        onChange={e => updateStatus(lead.id, e.target.value)}
                        disabled={updating === lead.id}
                        style={{
                          padding: "10px 14px",
                          borderRadius: 8,
                          border: "1px solid #e7e5e4",
                          background: updating === lead.id ? "#f5f5f4" : "white",
                          fontSize: 14,
                          cursor: updating === lead.id ? "wait" : "pointer",
                          minHeight: 44,
                        }}
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="dead">Dead</option>
                      </select>
                      <button
                        onClick={() => setConvertingLead(lead)}
                        disabled={updating === lead.id}
                        style={{
                          padding: "10px 14px",
                          borderRadius: 8,
                          border: "none",
                          background: "#c9251c",
                          color: "white",
                          fontSize: 14,
                          fontWeight: 500,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          whiteSpace: "nowrap",
                          minHeight: 44,
                        }}
                      >
                        <Icon name="userPlus" size={16} />
                        Convert
                      </button>
                    </>
                  )}
                  {updating === lead.id && (
                    <div className="adm-spinner" style={{ width: 16, height: 16 }} />
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Desktop: Table layout */
          <div style={{ overflowX: "auto" }}>
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Source</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(lead => (
                  <tr key={lead.id}>
                    <td style={{ fontWeight: 500 }}>{lead.name || "—"}</td>
                    <td>{lead.email}</td>
                    <td>{lead.phone || "—"}</td>
                    <td>
                      <span className="adm-badge adm-badge-gray">{lead.source}</span>
                    </td>
                    <td style={{ fontSize: 13, color: "#78716c" }}>{formatDate(lead.createdAt)}</td>
                    <td>
                      <span className={`adm-badge ${STATUS_COLORS[lead.status] || "adm-badge-gray"}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        {lead.status === "converted" ? (
                          <span style={{ fontSize: 13, color: "#78716c" }}>
                            Member
                          </span>
                        ) : (
                          <>
                            <select
                              value={lead.status}
                              onChange={e => updateStatus(lead.id, e.target.value)}
                              disabled={updating === lead.id}
                              style={{
                                padding: "6px 10px",
                                borderRadius: 6,
                                border: "1px solid #e7e5e4",
                                background: updating === lead.id ? "#f5f5f4" : "white",
                                fontSize: 13,
                                cursor: updating === lead.id ? "wait" : "pointer",
                              }}
                            >
                              <option value="new">New</option>
                              <option value="contacted">Contacted</option>
                              <option value="dead">Dead</option>
                            </select>
                            <button
                              onClick={() => setConvertingLead(lead)}
                              disabled={updating === lead.id}
                              title="Convert to member"
                              style={{
                                padding: "6px 10px",
                                borderRadius: 6,
                                border: "none",
                                background: "#c9251c",
                                color: "white",
                                fontSize: 13,
                                fontWeight: 500,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                whiteSpace: "nowrap",
                              }}
                            >
                              <Icon name="userPlus" size={14} />
                              Convert
                            </button>
                          </>
                        )}
                        {updating === lead.id && (
                          <div className="adm-spinner" style={{ width: 16, height: 16 }} />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
