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

export default function OverviewPage() {
  const [bookings, setBookings] = useState([]);
  const [todaySlots, setTodaySlots] = useState([]);
  const [loading, setLoading] = useState(true);

  const today = studioNow().isoDay;
  const weekEnd = iso(new Date(Date.parse(`${today}T00:00:00.000Z`) + 7 * 86400000));

  const load = useCallback(async () => {
    setLoading(true);
    const [b, s] = await Promise.all([
      fetch("/api/admin/bookings").then(r => r.ok ? r.json() : []).catch(() => []),
      fetch(`/api/availability?from=${today}&to=${today}&includePast=true`).then(r => r.ok ? r.json() : []).catch(() => []),
    ]);
    setBookings(b);
    setTodaySlots(s);
    setLoading(false);
  }, [today]);

  useEffect(() => { load(); }, [load]);

  const active = bookings.filter(b => b.status !== "cancelled");
  const todays = active.filter(b => b.date === today);
  const upcoming = active.filter(b => b.date >= today);
  const weekCount = active.filter(b => b.date >= today && b.date <= weekEnd).length;
  const pending = active.filter(b => b.status === "pending").length;

  const seatsToday = todaySlots.reduce((n, s) => n + s.capacity, 0);
  const utilization = seatsToday ? Math.round((todays.length / seatsToday) * 100) : 0;

  // Upcoming sessions for today
  const todaysSessions = todaySlots
    .filter(s => s.classType === "GROUP" || s.classType === "PT")
    .sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div>
      <div className="adm-page-header">
        <h1>Overview</h1>
        <p>Your daily dashboard at a glance</p>
      </div>

      {loading ? (
        <div className="adm-empty">
          <div className="adm-spinner" style={{ margin: "0 auto" }} />
        </div>
      ) : (
        <>
          <div className="adm-stats">
            <div className="adm-stat highlight">
              <div className="adm-stat-label">Booked Today</div>
              <div className="adm-stat-value">{todays.length}</div>
              <div className="adm-stat-sub">{utilization}% capacity</div>
            </div>
            <div className="adm-stat">
              <div className="adm-stat-label">Upcoming Total</div>
              <div className="adm-stat-value">{upcoming.length}</div>
              <div className="adm-stat-sub">all future bookings</div>
            </div>
            <div className="adm-stat">
              <div className="adm-stat-label">Next 7 Days</div>
              <div className="adm-stat-value">{weekCount}</div>
              <div className="adm-stat-sub">through {weekEnd}</div>
            </div>
            <div className={`adm-stat ${pending > 0 ? "highlight" : ""}`}>
              <div className="adm-stat-label">Awaiting Confirm</div>
              <div className="adm-stat-value">{pending}</div>
              <div className="adm-stat-sub">{pending === 0 ? "all clear" : "needs attention"}</div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            <div className="adm-card">
              <div className="adm-card-header">
                <h2 className="adm-card-title">Today's Schedule</h2>
                <span style={{ fontSize: 13, color: "#78716c" }}>{today}</span>
              </div>
              {todaysSessions.length === 0 ? (
                <div className="adm-empty" style={{ padding: 24 }}>
                  <p>No sessions scheduled for today</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {todaysSessions.map(s => {
                    const bookingsForSlot = todays.filter(b => b.time === s.time && b.classType === s.classType);
                    return (
                      <div key={s.sessionId} style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 14px",
                        background: "#fafaf9",
                        borderRadius: 8,
                      }}>
                        <div>
                          <div style={{ fontWeight: 600, color: "#1c1917" }}>{s.time}</div>
                          <div style={{ fontSize: 13, color: "#78716c" }}>
                            {s.classType === "pt" ? "1:1 Personal Training" : "Group Class"}
                          </div>
                        </div>
                        <div style={{
                          padding: "4px 12px",
                          borderRadius: 9999,
                          fontSize: 13,
                          fontWeight: 600,
                          background: bookingsForSlot.length >= s.capacity ? "#fef2f2" : bookingsForSlot.length > 0 ? "#dcfce7" : "#f5f5f4",
                          color: bookingsForSlot.length >= s.capacity ? "#991b1b" : bookingsForSlot.length > 0 ? "#166534" : "#57534e",
                        }}>
                          {bookingsForSlot.length}/{s.capacity}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="adm-card">
              <div className="adm-card-header">
                <h2 className="adm-card-title">Recent Bookings</h2>
              </div>
              {todays.length === 0 ? (
                <div className="adm-empty" style={{ padding: 24 }}>
                  <p>No bookings for today yet</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {todays.slice(0, 5).map(b => (
                    <div key={b.id} style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 14px",
                      background: "#fafaf9",
                      borderRadius: 8,
                    }}>
                      <div>
                        <div style={{ fontWeight: 600, color: "#1c1917" }}>{b.name}</div>
                        <div style={{ fontSize: 13, color: "#78716c" }}>{b.time} - {b.classType === "pt" ? "1:1" : "Group"}</div>
                      </div>
                      <span className={`adm-badge ${b.status === "confirmed" ? "adm-badge-green" : b.status === "pending" ? "adm-badge-yellow" : "adm-badge-gray"}`}>
                        {b.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <style>{`
        @media (max-width: 900px) {
          .adm-card + .adm-card { margin-top: 0; }
          div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
