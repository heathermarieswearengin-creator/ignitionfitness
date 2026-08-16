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

function Icon({ name, size = 20 }) {
  const icons = {
    check: <polyline points="20 6 9 17 4 12" />,
    x: <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>,
    calendar: <><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>,
    alertTriangle: <><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {icons[name]}
    </svg>
  );
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

// Toast notification
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colors = {
    success: { bg: "#dcfce7", border: "#86efac", text: "#166534" },
    error: { bg: "#fee2e2", border: "#fca5a5", text: "#991b1b" },
  };
  const c = colors[type] || colors.success;

  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 9999,
      display: "flex", alignItems: "center", gap: 12,
      padding: "14px 18px", background: c.bg, border: `1px solid ${c.border}`,
      borderRadius: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.15)", maxWidth: 360,
    }}>
      <Icon name={type === "success" ? "check" : "x"} size={18} />
      <span style={{ color: c.text, fontSize: 14, fontWeight: 500 }}>{message}</span>
      <button onClick={onClose} style={{ background: "none", border: "none", padding: 4, cursor: "pointer", color: c.text, opacity: 0.7 }}>
        <Icon name="x" size={14} />
      </button>
    </div>
  );
}

// Confirmation modal
function ConfirmModal({ title, message, confirmLabel, onConfirm, onCancel, loading }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9998,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.5)", padding: 20,
    }} onClick={onCancel}>
      <div style={{
        background: "white", borderRadius: 12, padding: 24,
        maxWidth: 400, width: "100%", boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 20 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, flexShrink: 0,
            background: "#fef2f2", display: "grid", placeItems: "center", color: "#dc2626",
          }}>
            <Icon name="alertTriangle" size={20} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#1c1917" }}>{title}</h3>
            <p style={{ margin: "8px 0 0", fontSize: 14, color: "#57534e", lineHeight: 1.5 }}>{message}</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
            disabled={loading}
            style={{
              padding: "10px 18px", borderRadius: 8, fontSize: 14, fontWeight: 500,
              background: "white", border: "1px solid #e7e5e4", color: "#57534e", cursor: "pointer",
            }}
          >
            Keep Booking
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              padding: "10px 18px", borderRadius: 8, fontSize: 14, fontWeight: 500,
              background: "#dc2626", border: "none", color: "white", cursor: loading ? "wait" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Cancelling..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// Reschedule modal with session picker
function RescheduleModal({ booking, onClose, onSuccess }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const today = studioNow().isoDay;
  const weekEnd = iso(new Date(Date.parse(today + "T00:00:00.000Z") + 14 * 86400000));

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/availability?from=${today}&to=${weekEnd}&type=${booking.classType}`);
        if (res.ok) {
          const data = await res.json();
          // Filter to only sessions with available capacity
          const available = data.filter(s =>
            s.id !== booking.sessionId &&
            s.status !== "CANCELLED" &&
            s.spotsRemaining > 0
          );
          setSessions(available);
        }
      } catch (err) {
        console.error("Failed to load sessions:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [today, weekEnd, booking.classType, booking.sessionId]);

  const handleReschedule = async () => {
    if (!selectedId) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newSessionId: selectedId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to reschedule");
        return;
      }

      onSuccess(data.newBooking);
    } catch (err) {
      setError("Failed to reschedule. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatSessionDate = (dateStr) => {
    const d = new Date(dateStr + "T00:00:00.000Z");
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9998,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.5)", padding: 20,
    }} onClick={onClose}>
      <div style={{
        background: "white", borderRadius: 12, padding: 24,
        maxWidth: 480, width: "100%", maxHeight: "80vh", overflow: "hidden",
        display: "flex", flexDirection: "column", boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
      }} onClick={e => e.stopPropagation()}>
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "#1c1917" }}>
            Reschedule Booking
          </h3>
          <p style={{ margin: "8px 0 0", fontSize: 14, color: "#57534e" }}>
            {booking.name} · {booking.classType === "pt" ? "1:1" : "Group"} class
          </p>
        </div>

        {error && (
          <div style={{
            padding: "12px 14px", marginBottom: 16, borderRadius: 8,
            background: "#fee2e2", border: "1px solid #fca5a5", color: "#991b1b", fontSize: 13,
          }}>
            {error}
          </div>
        )}

        <div style={{ flex: 1, overflowY: "auto", marginBottom: 20 }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: 40, color: "#78716c" }}>
              Loading available sessions...
            </div>
          ) : sessions.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "#78716c" }}>
              No available sessions in the next 2 weeks
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {sessions.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSelectedId(s.id)}
                  style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "14px 16px", borderRadius: 10, textAlign: "left",
                    background: selectedId === s.id ? "#fef2f2" : "#fafaf9",
                    border: selectedId === s.id ? "2px solid #c9251c" : "1px solid #e7e5e4",
                    cursor: "pointer", transition: "all 0.15s",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 14, color: "#1c1917" }}>
                      {formatSessionDate(s.date)} at {s.startTime}
                    </div>
                    <div style={{ fontSize: 12, color: "#78716c", marginTop: 2 }}>
                      {s.spotsRemaining} spot{s.spotsRemaining !== 1 ? "s" : ""} available
                    </div>
                  </div>
                  {selectedId === s.id && (
                    <div style={{ color: "#c9251c" }}>
                      <Icon name="check" size={20} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            disabled={submitting}
            style={{
              padding: "10px 18px", borderRadius: 8, fontSize: 14, fontWeight: 500,
              background: "white", border: "1px solid #e7e5e4", color: "#57534e", cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleReschedule}
            disabled={!selectedId || submitting}
            style={{
              padding: "10px 18px", borderRadius: 8, fontSize: 14, fontWeight: 500,
              background: selectedId ? "#c9251c" : "#d6d3d1", border: "none", color: "white",
              cursor: selectedId && !submitting ? "pointer" : "not-allowed",
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? "Rescheduling..." : "Confirm Reschedule"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [whenFilter, setWhenFilter] = useState("upcoming");
  const [toast, setToast] = useState(null);
  const [confirmCancel, setConfirmCancel] = useState(null);
  const [rescheduleBooking, setRescheduleBooking] = useState(null);
  const [cancelling, setCancelling] = useState(false);
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

  const handleCancel = async (booking) => {
    setCancelling(true);
    try {
      const res = await fetch(`/api/admin/bookings/${booking.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setBookings(prev => prev.map(b =>
          b.id === booking.id ? { ...b, status: "cancelled" } : b
        ));
        setToast({ message: `Booking cancelled. Email sent to ${booking.name}.`, type: "success" });
      } else {
        const data = await res.json().catch(() => ({}));
        setToast({ message: data.error || "Failed to cancel booking", type: "error" });
      }
    } catch (err) {
      setToast({ message: "Failed to cancel booking", type: "error" });
    } finally {
      setCancelling(false);
      setConfirmCancel(null);
    }
  };

  const handleRescheduleSuccess = (newBooking) => {
    // Remove old booking from list and add new one
    setBookings(prev => {
      const filtered = prev.filter(b => b.id !== rescheduleBooking.id);
      return [...filtered, newBooking].sort((a, b) =>
        a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date)
      );
    });
    setRescheduleBooking(null);
    setToast({ message: `Rescheduled! Email sent to ${newBooking.name}.`, type: "success" });
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

  const isActionable = (b) => b.status !== "cancelled" && b.date >= today;

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {confirmCancel && (
        <ConfirmModal
          title="Cancel this booking?"
          message={`This will cancel ${confirmCancel.name}'s ${confirmCancel.classType === "pt" ? "1:1" : "group"} session on ${formatDate(confirmCancel.date)} at ${confirmCancel.time} and send them a cancellation email.`}
          confirmLabel="Yes, Cancel Booking"
          onConfirm={() => handleCancel(confirmCancel)}
          onCancel={() => setConfirmCancel(null)}
          loading={cancelling}
        />
      )}
      {rescheduleBooking && (
        <RescheduleModal
          booking={rescheduleBooking}
          onClose={() => setRescheduleBooking(null)}
          onSuccess={handleRescheduleSuccess}
        />
      )}

      <div className="adm-page-header">
        <h1>Bookings</h1>
        <p>Manage all session bookings</p>
      </div>

      <div className="adm-card">
        {/* Filters */}
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
                      fontSize: 13, color: "#78716c",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {b.email}
                    </div>
                    {b.status === "cancelled" && b.cancellationReason && (
                      <div style={{ fontSize: 12, color: "#f59e0b", marginTop: 4 }}>
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
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                  <span style={{ fontFamily: "monospace", fontSize: 11, color: "#a8a29e" }}>{b.ref}</span>
                  {isActionable(b) ? (
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => setRescheduleBooking(b)}
                        style={{
                          padding: "8px 14px", fontSize: 12, borderRadius: 6,
                          background: "white", color: "#1c1917", border: "1px solid #e7e5e4",
                          cursor: "pointer", fontWeight: 500,
                        }}
                      >
                        Reschedule
                      </button>
                      <button
                        onClick={() => setConfirmCancel(b)}
                        style={{
                          padding: "8px 14px", fontSize: 12, borderRadius: 6,
                          background: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca",
                          cursor: "pointer", fontWeight: 500,
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <span style={{ fontSize: 12, color: "#a8a29e", fontStyle: "italic" }}>No actions</span>
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
                      {isActionable(b) ? (
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            onClick={() => setRescheduleBooking(b)}
                            style={{
                              padding: "6px 10px", fontSize: 12, borderRadius: 6,
                              background: "white", color: "#1c1917", border: "1px solid #e7e5e4",
                              cursor: "pointer", fontWeight: 500,
                            }}
                          >
                            Reschedule
                          </button>
                          <button
                            onClick={() => setConfirmCancel(b)}
                            style={{
                              padding: "6px 10px", fontSize: 12, borderRadius: 6,
                              background: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca",
                              cursor: "pointer", fontWeight: 500,
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: 12, color: "#a8a29e", fontStyle: "italic" }}>—</span>
                      )}
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
