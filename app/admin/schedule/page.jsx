"use client";
import { useState, useEffect, useCallback, useMemo } from "react";

function studioNow() {
  const now = new Date();
  const pacific = new Date(now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
  const iso = pacific.toISOString().slice(0, 10);
  return { isoDay: iso };
}

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function SchedulePage() {
  const [viewMode, setViewMode] = useState("week"); // "week" | "month"
  const [slots, setSlots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [standingClients, setStandingClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const today = studioNow().isoDay;

  const [viewDate, setViewDate] = useState(() => {
    const d = new Date(`${today}T00:00:00.000Z`);
    return { year: d.getUTCFullYear(), month: d.getUTCMonth(), day: d.getUTCDate() };
  });

  // Calculate week start (Sunday)
  const weekStart = useMemo(() => {
    const d = new Date(Date.UTC(viewDate.year, viewDate.month, viewDate.day));
    const dayOfWeek = d.getUTCDay();
    d.setUTCDate(d.getUTCDate() - dayOfWeek);
    return d.toISOString().slice(0, 10);
  }, [viewDate]);

  const weekEnd = useMemo(() => {
    const d = new Date(`${weekStart}T00:00:00.000Z`);
    d.setUTCDate(d.getUTCDate() + 6);
    return d.toISOString().slice(0, 10);
  }, [weekStart]);

  // Month days calculation
  const monthDays = useMemo(() => {
    const firstOfMonth = new Date(Date.UTC(viewDate.year, viewDate.month, 1));
    const lastOfMonth = new Date(Date.UTC(viewDate.year, viewDate.month + 1, 0));
    const startPad = firstOfMonth.getUTCDay();
    const totalDays = lastOfMonth.getUTCDate();

    const days = [];
    for (let i = 0; i < startPad; i++) {
      const d = new Date(Date.UTC(viewDate.year, viewDate.month, 1 - (startPad - i)));
      days.push({ date: d.toISOString().slice(0, 10), outside: true });
    }
    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(Date.UTC(viewDate.year, viewDate.month, i));
      days.push({ date: d.toISOString().slice(0, 10), outside: false });
    }
    while (days.length < 42) {
      const last = new Date(`${days[days.length - 1].date}T00:00:00.000Z`);
      last.setUTCDate(last.getUTCDate() + 1);
      days.push({ date: last.toISOString().slice(0, 10), outside: true });
    }
    return days;
  }, [viewDate]);

  // Week days
  const weekDays = useMemo(() => {
    const days = [];
    const start = new Date(`${weekStart}T00:00:00.000Z`);
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setUTCDate(d.getUTCDate() + i);
      days.push(d.toISOString().slice(0, 10));
    }
    return days;
  }, [weekStart]);

  const load = useCallback(async () => {
    setLoading(true);
    const from = viewMode === "week" ? weekStart : monthDays[0].date;
    const to = viewMode === "week" ? weekEnd : monthDays[monthDays.length - 1].date;

    const [s, b, bl, sc] = await Promise.all([
      fetch(`/api/availability?from=${from}&to=${to}&includePast=true`).then(r => r.ok ? r.json() : []).catch(() => []),
      fetch("/api/admin/bookings").then(r => r.ok ? r.json() : []).catch(() => []),
      fetch(`/api/admin/blocks?from=${from}`).then(r => r.ok ? r.json() : []).catch(() => []),
      fetch("/api/admin/standing-clients").then(r => r.ok ? r.json() : []).catch(() => []),
    ]);
    setSlots(s);
    setBookings(b.filter(x => x.date >= from && x.date <= to));
    setBlocks(bl);
    setStandingClients(sc.filter(x => x.active && !x.ended));
    setLoading(false);
  }, [viewMode, weekStart, weekEnd, monthDays]);

  useEffect(() => { load(); }, [load]);

  const prevPeriod = () => {
    if (viewMode === "week") {
      const d = new Date(`${weekStart}T00:00:00.000Z`);
      d.setUTCDate(d.getUTCDate() - 7);
      setViewDate({ year: d.getUTCFullYear(), month: d.getUTCMonth(), day: d.getUTCDate() });
    } else {
      const d = new Date(Date.UTC(viewDate.year, viewDate.month - 1, 1));
      setViewDate({ year: d.getUTCFullYear(), month: d.getUTCMonth(), day: 1 });
    }
  };

  const nextPeriod = () => {
    if (viewMode === "week") {
      const d = new Date(`${weekStart}T00:00:00.000Z`);
      d.setUTCDate(d.getUTCDate() + 7);
      setViewDate({ year: d.getUTCFullYear(), month: d.getUTCMonth(), day: d.getUTCDate() });
    } else {
      const d = new Date(Date.UTC(viewDate.year, viewDate.month + 1, 1));
      setViewDate({ year: d.getUTCFullYear(), month: d.getUTCMonth(), day: 1 });
    }
  };

  const goToday = () => {
    const d = new Date(`${today}T00:00:00.000Z`);
    setViewDate({ year: d.getUTCFullYear(), month: d.getUTCMonth(), day: d.getUTCDate() });
  };

  const getSlotsForDate = (date) => slots.filter(s => s.date === date);
  const getBookingsForSlot = (sessionId) => bookings.filter(b => b.sessionId === sessionId);
  const isBlocked = (date) => blocks.some(b => b.date === date);

  // Check if a PT slot is covered by a standing client
  const getStandingClientForSlot = (date, startTime, type) => {
    if (type !== "PT") return null;
    const d = new Date(`${date}T00:00:00.000Z`);
    const dow = d.getUTCDay();

    for (const sc of standingClients) {
      if (!sc.daysOfWeek.includes(dow)) continue;
      if (sc.startTime !== startTime) continue;
      if (sc.endDate && date > sc.endDate) continue;
      if (sc.upcomingSkips?.includes(date)) continue;
      return sc;
    }
    return null;
  };

  const getInitials = (name) => (name || "").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  const formatDateLabel = (date) => {
    const d = new Date(`${date}T00:00:00.000Z`);
    return d.getUTCDate();
  };

  return (
    <div>
      <div className="adm-page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1>Schedule</h1>
          <p>View and manage your training sessions</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className={`adm-filter-btn ${viewMode === "week" ? "active" : ""}`}
            onClick={() => setViewMode("week")}
          >
            Week
          </button>
          <button
            className={`adm-filter-btn ${viewMode === "month" ? "active" : ""}`}
            onClick={() => setViewMode("month")}
          >
            Month
          </button>
        </div>
      </div>

      <div className="adm-card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button className="adm-btn adm-btn-secondary" style={{ padding: "8px 12px" }} onClick={prevPeriod}>&larr;</button>
            <button className="adm-btn adm-btn-secondary" style={{ padding: "8px 12px" }} onClick={nextPeriod}>&rarr;</button>
            <button className="adm-btn adm-btn-secondary" style={{ padding: "8px 12px" }} onClick={goToday}>Today</button>
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "#1c1917", margin: 0 }}>
            {viewMode === "week"
              ? `Week of ${new Date(`${weekStart}T00:00:00.000Z`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
              : `${MONTH_NAMES[viewDate.month]} ${viewDate.year}`
            }
          </h2>
        </div>

        {loading ? (
          <div className="adm-empty">
            <div className="adm-spinner" style={{ margin: "0 auto" }} />
          </div>
        ) : viewMode === "week" ? (
          /* Week View */
          <div style={{ overflowX: "auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(120px, 1fr))", gap: 8, minWidth: 840 }}>
              {weekDays.map(date => {
                const daySlots = getSlotsForDate(date);
                const blocked = isBlocked(date);
                const isToday = date === today;
                const isPast = date < today;

                return (
                  <div key={date} style={{
                    background: blocked ? "#fef2f2" : isToday ? "#fffbeb" : "#fafaf9",
                    borderRadius: 8,
                    border: isToday ? "2px solid #c9251c" : "1px solid #e7e5e4",
                    padding: 12,
                    opacity: isPast ? 0.5 : 1,
                  }}>
                    <div style={{ marginBottom: 12, textAlign: "center" }}>
                      <div style={{ fontSize: 12, color: "#78716c", textTransform: "uppercase" }}>
                        {DAY_NAMES[new Date(`${date}T00:00:00.000Z`).getUTCDay()]}
                      </div>
                      <div style={{ fontSize: 24, fontWeight: 700, color: isToday ? "#c9251c" : "#1c1917" }}>
                        {formatDateLabel(date)}
                      </div>
                    </div>

                    {blocked && (
                      <div style={{ padding: "6px 8px", background: "#fee2e2", borderRadius: 6, fontSize: 12, color: "#991b1b", textAlign: "center", marginBottom: 8 }}>
                        Blocked
                      </div>
                    )}

                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {daySlots.map(slot => {
                        const slotBookings = getBookingsForSlot(slot.sessionId);
                        const isFull = slotBookings.length >= slot.capacity;
                        const standingClient = getStandingClientForSlot(date, slot.startTime, slot.type);

                        return (
                          <button
                            key={slot.sessionId}
                            onClick={() => setSelectedSlot(selectedSlot?.sessionId === slot.sessionId ? null : { ...slot, standingClient })}
                            style={{
                              padding: "8px 10px",
                              background: standingClient ? "#f3e8ff" : isFull ? "#fee2e2" : "white",
                              border: `1.5px solid ${standingClient ? "#a855f7" : isFull ? "#fecaca" : "#e7e5e4"}`,
                              borderRadius: 6,
                              cursor: "pointer",
                              textAlign: "left",
                            }}
                          >
                            {standingClient ? (
                              <>
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  <span style={{ fontSize: 12 }}>🔁</span>
                                  <span style={{ fontSize: 13, fontWeight: 600, color: "#7c3aed" }}>{slot.time}</span>
                                </div>
                                <div style={{ fontSize: 11, color: "#7c3aed" }}>
                                  {getInitials(standingClient.memberName)} · Standing
                                </div>
                              </>
                            ) : (
                              <>
                                <div style={{ fontSize: 13, fontWeight: 600, color: "#1c1917" }}>{slot.time}</div>
                                <div style={{ fontSize: 11, color: "#78716c" }}>
                                  {slot.classType === "pt" ? "1:1" : "Group"} · {slotBookings.length}/{slot.capacity}
                                </div>
                              </>
                            )}
                          </button>
                        );
                      })}
                      {daySlots.length === 0 && !blocked && (
                        <div style={{ fontSize: 12, color: "#a8a29e", textAlign: "center", padding: 8 }}>
                          No sessions
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Month View */
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 8 }}>
              {DAY_NAMES.map(d => (
                <div key={d} style={{ textAlign: "center", fontSize: 12, color: "#78716c", padding: 8, fontWeight: 500 }}>
                  {d}
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
              {monthDays.map(({ date, outside }) => {
                const daySlots = getSlotsForDate(date);
                const blocked = isBlocked(date);
                const isToday = date === today;
                const isPast = date < today;
                const totalBooked = daySlots.reduce((sum, s) => sum + getBookingsForSlot(s.sessionId).length, 0);
                const totalCap = daySlots.reduce((sum, s) => sum + s.capacity, 0);

                return (
                  <div key={date} style={{
                    aspectRatio: "1",
                    background: outside ? "transparent" : blocked ? "#fef2f2" : isToday ? "#fffbeb" : "white",
                    border: outside ? "none" : isToday ? "2px solid #c9251c" : "1px solid #e7e5e4",
                    borderRadius: 8,
                    padding: 8,
                    opacity: outside ? 0.3 : isPast ? 0.5 : 1,
                    display: "flex",
                    flexDirection: "column",
                  }}>
                    <div style={{ fontSize: 14, fontWeight: isToday ? 700 : 500, color: isToday ? "#c9251c" : "#1c1917" }}>
                      {formatDateLabel(date)}
                    </div>
                    {!outside && daySlots.length > 0 && (
                      <div style={{ marginTop: "auto", fontSize: 11, color: "#78716c" }}>
                        {totalBooked}/{totalCap}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Slot detail modal */}
      {selectedSlot && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: 16,
        }} onClick={() => setSelectedSlot(null)}>
          <div className="adm-card" style={{ maxWidth: 400, width: "100%" }} onClick={e => e.stopPropagation()}>
            <div className="adm-card-header">
              <h2 className="adm-card-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {selectedSlot.standingClient && <span>🔁</span>}
                {selectedSlot.date} at {selectedSlot.time}
              </h2>
              <button onClick={() => setSelectedSlot(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#78716c", fontSize: 20 }}>
                &times;
              </button>
            </div>

            {selectedSlot.standingClient ? (
              <>
                <div style={{
                  padding: 14,
                  background: "#f3e8ff",
                  borderRadius: 8,
                  marginBottom: 16,
                  border: "1px solid #e9d5ff",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: 9,
                      background: "#7c3aed",
                      color: "#fff",
                      display: "grid",
                      placeItems: "center",
                      fontSize: 13,
                      fontWeight: 600,
                    }}>
                      {getInitials(selectedSlot.standingClient.memberName)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: "#581c87" }}>{selectedSlot.standingClient.memberName}</div>
                      <div style={{ fontSize: 12, color: "#7c3aed" }}>Standing Client</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: "#6b21a8" }}>
                    Every {selectedSlot.standingClient.daysLabel} · {selectedSlot.standingClient.endDate ? `Until ${selectedSlot.standingClient.endDate}` : "Ongoing"}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <a
                    href={`/admin/standing-clients`}
                    style={{
                      flex: 1,
                      padding: "10px 14px",
                      background: "#f5f5f4",
                      border: "1px solid #e7e5e4",
                      borderRadius: 8,
                      textAlign: "center",
                      fontSize: 13,
                      fontWeight: 500,
                      color: "#1c1917",
                      textDecoration: "none",
                    }}
                  >
                    Manage Standing Client
                  </a>
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 14, color: "#78716c", marginBottom: 16 }}>
                  {selectedSlot.classType === "pt" ? "1:1 Personal Training" : "Group Class"}
                </div>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>
                  Bookings ({getBookingsForSlot(selectedSlot.sessionId).length}/{selectedSlot.capacity})
                </div>
                {getBookingsForSlot(selectedSlot.sessionId).length === 0 ? (
                  <p style={{ color: "#78716c", fontSize: 14 }}>No bookings yet</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {getBookingsForSlot(selectedSlot.sessionId).map(b => (
                      <div key={b.id} style={{ padding: 10, background: "#fafaf9", borderRadius: 6 }}>
                        <div style={{ fontWeight: 500 }}>{b.name}</div>
                        <div style={{ fontSize: 13, color: "#78716c" }}>{b.email}</div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
