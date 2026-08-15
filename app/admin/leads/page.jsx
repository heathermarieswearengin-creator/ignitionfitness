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

export default function LeadsPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [updating, setUpdating] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/leads").catch(() => null);
    setLeads(res?.ok ? await res.json() : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id, status) => {
    setUpdating(id);
    try {
      const res = await fetch(`/api/admin/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
      }
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
                      <select
                        value={lead.status}
                        onChange={e => updateStatus(lead.id, e.target.value)}
                        disabled={updating === lead.id}
                        style={{
                          padding: "6px 10px",
                          borderRadius: 6,
                          border: "1px solid #e7e5e4",
                          background: "white",
                          fontSize: 13,
                          cursor: "pointer",
                        }}
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="converted">Converted</option>
                        <option value="dead">Dead</option>
                      </select>
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
