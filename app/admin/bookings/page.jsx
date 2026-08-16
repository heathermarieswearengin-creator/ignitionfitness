"use client";
import { useState, useEffect, useCallback } from "react";

function studioNow() {
  const now = new Date();
  const pacific = new Date(now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
  const iso = pacific.toISOString().slice(0, 10);
  return { isoDay: iso };
}

function iso(d) {
  return d.toISOString().slice(0, 10);
}

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
  { value: "confirmed", label: "Confirmed" },
  { value: "pending", label: "Pending" },
  { value: "cancelled", label: "Cancelled" },
];

const WHEN_OPTIONS = [
  { value: "upcoming", label: "Upcoming" },
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "all", label: "All Time" },
];

export default function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [whenFilter, setWhenFilter] = useState("upcoming");
  const [updating, setUpdating] = useState(null);
  const isMobile = useIsMobile();

  const today = studioNow().isoDay;
  const weekEnd = iso(new Date(Date.parse(today + "T00:00:00.000Z") + 7 * 86400000));

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/bookings").catch(() => null);
    setBookings(res?.ok ? await res.json() : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id, status) => {
    setUpdating(id);
    try {
      const res = await fetch("/api/admin/bookings/" + id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
      }
    } finally {
      setUpdating(null);
    }
  };

  const filtered = bookings
    .filter(b => statusFilter === "all" || b.status === statusFilter)
    .filter(b => {
      if (whenFilter === "today") return b.date === today;
      if (whenFilter === "week") return b.date >= today && b.date <= weekEnd;
      if (whenFilter === "upcoming") return b.date >= today;
      return true;
    })
    .sort((a, b) => a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date));

  const formatDate = (date) => {
    const d = new Date(date + "T00:00:00.000Z");
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  const statusBadgeClass = (status) => {
    if (status === "confirmed") return "adm-badge-green";
    if (status === "pending") return "adm-badge-yellow";
    return "adm-badge-red";
  };

  return (
    <div>
      <div className="adm-page-header">
        <h1>Bookings</h1>
        <p>Manage all session bookings</p>
      </div>

      <div className="adm-card">
        {/* Filter rows - horizontally scrollable on mobile */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
          <div>
            <div className="adm-label" style={{ marginBottom: 8 }}>Status</div>
            <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
              {STATUS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  className={"adm-filter-btn " + (statusFilter === opt.value ? "active" : "")}
                  onClick={() => setStatusFilter(opt.value)}
                  style={{ flexShrink: 0 }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="adm-label" style={{ marginBottom: 8 }}>When</div>
            <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
              {WHEN_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  className={"adm-filter-btn " + (whenFilter === opt.value ? "active" : "")}
                  onClick={() => setWhenFilter(opt.value)}
                  style={{ flexShrink: 0 }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="adm-empty">
            <div className="adm-spinner" style={{ margin: "0 auto" }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="adm-empty">
            <div className="adm-empty-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 6h11M9 12h11M9 18h11M5 6h.01M5 12h.01M5 18h.01" />
              </svg>
            </div>
            <p>No bookings match your filters</p>
          </div>
        ) : isMobile ? (
          /* Mobile: Card layout */
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filtered.map(b => (
              <div
                key={b.id}
                style={{
                  padding: 16,
                  background: "white",
                  border: "1px solid #e7e5e4",
                  borderRadius: 10,
                  borderLeft: `4px solid ${b.classType === "pt" ? "#a855f7" : "#22c55e"}`,
                }}
              >
                {/* Top row: Name + Status badge */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 15, color: "#1c1917", marginBottom: 2 }}>
                      {b.name}
                    </div>
                    <div style={{
                      fontSize: 13,
                      color: "#78716c",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}>
                      {b.email}
                    </div>
                    {/* Cancellation reason */}
                    {b.status === "cancelled" && b.cancellationReason && (
                      <div style={{
                        fontSize: 12,
                        color: "#f59e0b",
                        marginTop: 4,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}>
                        <span style={{ fontWeight: 500 }}>Reason:</span> {b.cancellationReason}
                      </div>
                    )}
                  </div>
                  <span className={"adm-badge " + statusBadgeClass(b.status)} style={{ flexShrink: 0, marginLeft: 8 }}>
                    {b.status}
                  </span>
                </div>

                {/* Date/Time row */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, fontSize: 13, color: "#57534e" }}>
                  <span style={{ fontWeight: 500 }}>{formatDate(b.date)}</span>
                  <span style={{ color: "#a8a29e" }}>·</span>
                  <span>{b.time}</span>
                  <span style={{ color: "#a8a29e" }}>·</span>
                  <span className={"adm-badge " + (b.classType === "pt" ? "adm-badge-gray" : "adm-badge-green")} style={{ fontSize: 11 }}>
                    {b.classType === "pt" ? "1:1" : "Group"}
                  </span>
                </div>

                {/* Bottom row: Ref + Actions */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontFamily: "monospace", fontSize: 11, color: "#a8a29e" }}>{b.ref}</span>
                  {b.status !== "cancelled" && (
                    <button
                      className="adm-btn"
                      style={{
                        padding: "8px 14px",
                        fontSize: 12,
                        background: "#fef2f2",
                        color: "#991b1b",
                        border: "1px solid #fecaca",
                        minHeight: 36,
                      }}
                      onClick={() => updateStatus(b.id, "cancelled")}
                      disabled={updating === b.id}
                    >
                      {updating === b.id ? "..." : "Cancel"}
                    </button>
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
                  <th>Ref</th>
                  <th>Name</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(b => (
                  <tr key={b.id}>
                    <td style={{ fontFamily: "monospace", fontSize: 12 }}>{b.ref}</td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{b.name}</div>
                      <div style={{ fontSize: 12, color: "#78716c" }}>{b.email}</div>
                      {/* Cancellation reason */}
                      {b.status === "cancelled" && b.cancellationReason && (
                        <div style={{ fontSize: 11, color: "#f59e0b", marginTop: 2 }}>
                          Reason: {b.cancellationReason}
                        </div>
                      )}
                    </td>
                    <td>{formatDate(b.date)}</td>
                    <td>{b.time}</td>
                    <td>
                      <span className={"adm-badge " + (b.classType === "pt" ? "adm-badge-gray" : "adm-badge-green")}>
                        {b.classType === "pt" ? "1:1" : "Group"}
                      </span>
                    </td>
                    <td>
                      <span className={"adm-badge " + statusBadgeClass(b.status)}>
                        {b.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        {b.status !== "cancelled" && (
                          <button
                            className="adm-btn"
                            style={{ padding: "6px 10px", fontSize: 12, background: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca" }}
                            onClick={() => updateStatus(b.id, "cancelled")}
                            disabled={updating === b.id}
                          >
                            Cancel
                          </button>
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
