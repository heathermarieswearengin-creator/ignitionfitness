"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

function Icon({ name, size = 20 }) {
  const icons = {
    mail: <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></>,
    inbox: <path d="M22 12h-6l-2 3H10l-2-3H2M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />,
    check: <polyline points="20 6 9 17 4 12" />,
    arrowRight: <><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {icons[name]}
    </svg>
  );
}

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
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [newLeads, setNewLeads] = useState(0);

  const today = studioNow().isoDay;
  const weekEnd = iso(new Date(Date.parse(`${today}T00:00:00.000Z`) + 7 * 86400000));

  const load = useCallback(async () => {
    setLoading(true);
    const [b, s, msgData, leadsData] = await Promise.all([
      fetch("/api/admin/bookings").then(r => r.ok ? r.json() : []).catch(() => []),
      fetch(`/api/availability?from=${today}&to=${today}&includePast=true`).then(r => r.ok ? r.json() : []).catch(() => []),
      fetch("/api/admin/messages").then(r => r.ok ? r.json() : { unreadCount: 0 }).catch(() => ({ unreadCount: 0 })),
      fetch("/api/admin/leads").then(r => r.ok ? r.json() : []).catch(() => []),
    ]);
    setBookings(b);
    setTodaySlots(s);
    setUnreadMessages(msgData.unreadCount || 0);
    setNewLeads(Array.isArray(leadsData) ? leadsData.filter(l => l.status === "new").length : 0);
    setLoading(false);
  }, [today]);

  useEffect(() => { load(); }, [load]);

  const needsAttention = unreadMessages > 0 || newLeads > 0;

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
          {/* Needs Your Attention Section */}
          <div className="attn-section">
            <h2 className="attn-title">Needs Your Attention</h2>
            {needsAttention ? (
              <div className="attn-cards">
                {unreadMessages > 0 && (
                  <Link href="/admin/messages" className="attn-card">
                    <div className="attn-icon attn-icon-messages">
                      <Icon name="mail" size={20} />
                    </div>
                    <div className="attn-content">
                      <span className="attn-count">{unreadMessages}</span>
                      <span className="attn-label">new {unreadMessages === 1 ? "message" : "messages"}</span>
                    </div>
                    <Icon name="arrowRight" size={18} />
                  </Link>
                )}
                {newLeads > 0 && (
                  <Link href="/admin/leads" className="attn-card">
                    <div className="attn-icon attn-icon-leads">
                      <Icon name="inbox" size={20} />
                    </div>
                    <div className="attn-content">
                      <span className="attn-count">{newLeads}</span>
                      <span className="attn-label">new {newLeads === 1 ? "lead" : "leads"}</span>
                    </div>
                    <Icon name="arrowRight" size={18} />
                  </Link>
                )}
              </div>
            ) : (
              <div className="attn-clear">
                <div className="attn-clear-icon">
                  <Icon name="check" size={24} />
                </div>
                <div className="attn-clear-text">
                  <span className="attn-clear-title">All caught up!</span>
                  <span className="attn-clear-sub">No new messages or leads to review</span>
                </div>
              </div>
            )}
          </div>

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
        .attn-section {
          margin-bottom: 24px;
        }
        .attn-title {
          font-size: 14px;
          font-weight: 600;
          color: #78716c;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin: 0 0 12px;
        }
        .attn-cards {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }
        .attn-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 20px;
          background: white;
          border: 1px solid #e7e5e4;
          border-radius: 12px;
          text-decoration: none;
          transition: all 0.15s;
          flex: 1;
          min-width: 200px;
        }
        .attn-card:hover {
          border-color: #c9251c;
          box-shadow: 0 2px 8px rgba(201, 37, 28, 0.1);
        }
        .attn-card:hover svg:last-child {
          transform: translateX(4px);
        }
        .attn-card svg:last-child {
          color: #a8a29e;
          transition: transform 0.15s;
          margin-left: auto;
        }
        .attn-icon {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .attn-icon-messages {
          background: #fef2f2;
          color: #c9251c;
        }
        .attn-icon-leads {
          background: #fef9c3;
          color: #854d0e;
        }
        .attn-content {
          display: flex;
          flex-direction: column;
        }
        .attn-count {
          font-size: 24px;
          font-weight: 700;
          color: #1c1917;
          line-height: 1;
        }
        .attn-label {
          font-size: 14px;
          color: #78716c;
          margin-top: 2px;
        }
        .attn-clear {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px 24px;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 12px;
        }
        .attn-clear-icon {
          width: 44px;
          height: 44px;
          background: #dcfce7;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #166534;
        }
        .attn-clear-text {
          display: flex;
          flex-direction: column;
        }
        .attn-clear-title {
          font-size: 16px;
          font-weight: 600;
          color: #166534;
        }
        .attn-clear-sub {
          font-size: 14px;
          color: #15803d;
        }
        @media (max-width: 900px) {
          .adm-card + .adm-card { margin-top: 0; }
          div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
          .attn-cards {
            flex-direction: column;
          }
          .attn-card {
            min-width: 0;
          }
        }
      `}</style>
    </div>
  );
}
