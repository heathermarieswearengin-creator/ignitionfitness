"use client";
import { useState, useEffect, useCallback } from "react";

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

export default function LeadsPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [updating, setUpdating] = useState(null);
  const [toast, setToast] = useState(null);

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

  const updateStatus = async (id, newStatus, lead) => {
    const previousStatus = lead.status;

    // If changing TO "converted", use the convert endpoint
    if (newStatus === "converted" && previousStatus !== "converted") {
      await convertLead(id, lead);
      return;
    }

    // Otherwise, just update the status
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

  const convertLead = async (id, lead) => {
    setUpdating(id);
    try {
      const res = await fetch(`/api/leads/${id}/convert`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || "Failed to convert lead", "error");
        return;
      }

      // Update the lead in local state
      setLeads(prev => prev.map(l => l.id === id ? { ...l, status: "converted" } : l));

      // Show appropriate success message
      if (data.alreadyHadAccount) {
        const bookingMsg = data.adoptedBookings > 0
          ? ` Linked ${data.adoptedBookings} guest booking${data.adoptedBookings > 1 ? "s" : ""} to their account.`
          : "";
        showToast(`${lead.name || lead.email} already has an account.${bookingMsg}`, "info");
      } else {
        if (data.setPasswordEmailSent) {
          const bookingMsg = data.adoptedBookings > 0
            ? ` ${data.adoptedBookings} guest booking${data.adoptedBookings > 1 ? "s" : ""} linked.`
            : "";
          showToast(`Account created for ${lead.name || lead.email}! Password setup email sent.${bookingMsg}`, "success");
        } else {
          // Email failed but account was created
          showToast(
            `Account created for ${lead.name || lead.email}, but email failed to send. They'll need a manual password reset.`,
            "warning"
          );
        }
      }
    } catch (err) {
      console.error("Convert error:", err);
      showToast("Failed to convert lead. Please try again.", "error");
    } finally {
      setUpdating(null);
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
        <div className="adm-filters" style={{ marginBottom: 20 }}>
          {STATUS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              className={`adm-filter-btn ${statusFilter === opt.value ? "active" : ""}`}
              onClick={() => setStatusFilter(opt.value)}
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
        ) : (
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
                        <select
                          value={lead.status}
                          onChange={e => updateStatus(lead.id, e.target.value, lead)}
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
                          <option value="converted">Convert to Member</option>
                          <option value="dead">Dead</option>
                        </select>
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
