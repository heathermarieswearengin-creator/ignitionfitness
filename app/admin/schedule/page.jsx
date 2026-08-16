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
const DAY_NAMES_SHORT = ["S", "M", "T", "W", "T", "F", "S"];

// Detect mobile for default view
const isMobileDevice = () => typeof window !== "undefined" && window.innerWidth < 768;

export default function SchedulePage() {
  const [viewMode, setViewMode] = useState(() => isMobileDevice() ? "day" : "week");
  const [slots, setSlots] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [standingClients, setStandingClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [rescheduleMode, setRescheduleMode] = useState(false);
  const [rescheduleSlots, setRescheduleSlots] = useState([]);

  const today = studioNow().isoDay;

  const [viewDate, setViewDate] = useState(() => {
    const d = new Date(`${today}T00:00:00.000Z`);
    return { year: d.getUTCFullYear(), month: d.getUTCMonth(), day: d.getUTCDate() };
  });

  // Selected day for day view
  const selectedDay = useMemo(() => {
    const d = new Date(Date.UTC(viewDate.year, viewDate.month, viewDate.day));
    return d.toISOString().slice(0, 10);
  }, [viewDate]);

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

  const load = useCallback(async () => {
    setLoading(true);
    const from = viewMode === "month" ? monthDays[0].date : weekStart;
    const to = viewMode === "month" ? monthDays[monthDays.length - 1].date : weekEnd;

    const [s, bl, sc] = await Promise.all([
      fetch(`/api/admin/sessions?from=${from}&to=${to}`).then(r => r.ok ? r.json() : []).catch(() => []),
      fetch(`/api/admin/blocks?from=${from}&to=${to}`).then(r => r.ok ? r.json() : []).catch(() => []),
      fetch("/api/admin/standing-clients").then(r => r.ok ? r.json() : []).catch(() => []),
    ]);
    setSlots(s);
    setBlocks(bl);
    setStandingClients(sc.filter(x => x.active && !x.ended));
    setLoading(false);
  }, [viewMode, weekStart, weekEnd, monthDays]);

  useEffect(() => { load(); }, [load]);

  const prevPeriod = () => {
    if (viewMode === "day") {
      const d = new Date(Date.UTC(viewDate.year, viewDate.month, viewDate.day - 1));
      setViewDate({ year: d.getUTCFullYear(), month: d.getUTCMonth(), day: d.getUTCDate() });
    } else if (viewMode === "week") {
      const d = new Date(`${weekStart}T00:00:00.000Z`);
      d.setUTCDate(d.getUTCDate() - 7);
      setViewDate({ year: d.getUTCFullYear(), month: d.getUTCMonth(), day: d.getUTCDate() });
    } else {
      const d = new Date(Date.UTC(viewDate.year, viewDate.month - 1, 1));
      setViewDate({ year: d.getUTCFullYear(), month: d.getUTCMonth(), day: 1 });
    }
  };

  const nextPeriod = () => {
    if (viewMode === "day") {
      const d = new Date(Date.UTC(viewDate.year, viewDate.month, viewDate.day + 1));
      setViewDate({ year: d.getUTCFullYear(), month: d.getUTCMonth(), day: d.getUTCDate() });
    } else if (viewMode === "week") {
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

  const goToDate = (date) => {
    const d = new Date(`${date}T00:00:00.000Z`);
    setViewDate({ year: d.getUTCFullYear(), month: d.getUTCMonth(), day: d.getUTCDate() });
    if (viewMode !== "day") setViewMode("day");
  };

  const getSlotsForDate = (date) => slots.filter(s => s.date === date);
  const isDateBlocked = (date) => blocks.some(b => b.date === date && b.allDay);
  const getBlockReason = (date) => blocks.find(b => b.date === date && b.allDay)?.reason;

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

  const formatFullDate = (date) => {
    const d = new Date(`${date}T00:00:00.000Z`);
    return d.toLocaleDateString("en-US", { timeZone: "UTC", weekday: "long", month: "long", day: "numeric" });
  };

  // Cancel booking
  const handleCancelBooking = async (bookingId) => {
    if (!confirm("Cancel this booking? The client will receive a cancellation email.")) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to cancel booking");
      }
      setSelectedSlot(null);
      setSelectedBooking(null);
      await load();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Start reschedule flow
  const startReschedule = async (booking) => {
    setSelectedBooking(booking);
    setRescheduleMode(true);
    setActionError(null);

    // Fetch available slots for the same session type
    const fromDate = today;
    const toDate = new Date(Date.parse(`${today}T00:00:00Z`) + 30 * 86400000).toISOString().slice(0, 10);

    try {
      const res = await fetch(`/api/availability?from=${fromDate}&to=${toDate}&includePast=false`);
      const data = await res.ok ? await res.json() : [];
      // Filter to same session type
      setRescheduleSlots(data.filter(s => s.type === booking.sessionType && s.spotsLeft > 0));
    } catch {
      setRescheduleSlots([]);
    }
  };

  // Complete reschedule
  const completeReschedule = async (newSessionId) => {
    if (!selectedBooking) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/bookings/${selectedBooking.bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newSessionId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to reschedule");
      }
      setSelectedSlot(null);
      setSelectedBooking(null);
      setRescheduleMode(false);
      await load();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const closeModal = () => {
    setSelectedSlot(null);
    setSelectedBooking(null);
    setRescheduleMode(false);
    setActionError(null);
  };

  // Render a slot card
  const SlotCard = ({ slot, date, compact = false }) => {
    const standingClient = getStandingClientForSlot(date, slot.startTime, slot.type);
    const hasBookings = (slot.attendees?.filter(a => a.status !== "cancelled").length || 0) > 0;
    const bookedCount = slot.attendees?.filter(a => a.status !== "cancelled").length || 0;
    const isFull = bookedCount >= slot.capacity;
    const isGroup = slot.type === "GROUP";

    // Color coding: left border for session type, background tint for bookings
    const borderColor = standingClient ? "#a855f7" : isGroup ? "#3b82f6" : "#c9251c";
    const bgColor = hasBookings
      ? (standingClient ? "#f3e8ff" : "rgba(34, 197, 94, 0.08)")
      : (standingClient ? "#f3e8ff" : "#fafaf9");

    return (
      <button
        onClick={() => setSelectedSlot({ ...slot, date, standingClient })}
        style={{
          width: "100%",
          padding: compact ? "8px 10px" : "12px 14px",
          background: bgColor,
          border: `1.5px solid ${hasBookings ? (standingClient ? "#e9d5ff" : "rgba(34, 197, 94, 0.3)") : "#e7e5e4"}`,
          borderLeft: `4px solid ${borderColor}`,
          borderRadius: 8,
          cursor: "pointer",
          textAlign: "left",
          transition: "all 0.15s",
        }}
      >
        {standingClient ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 12 }}>🔁</span>
              <span style={{ fontSize: compact ? 12 : 14, fontWeight: 600, color: "#7c3aed" }}>{slot.time}</span>
            </div>
            <div style={{ fontSize: 11, color: "#7c3aed" }}>
              {getInitials(standingClient.memberName)} · Standing
            </div>
          </>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <span style={{ fontSize: compact ? 12 : 14, fontWeight: 600, color: "#1c1917" }}>{slot.time}</span>
              {hasBookings && (
                <span style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: isFull ? "#ef4444" : "#22c55e",
                  flexShrink: 0,
                }} />
              )}
            </div>
            <div style={{ fontSize: 11, color: hasBookings ? "#166534" : "#78716c", marginTop: 2 }}>
              {isGroup ? "Group" : "1:1"} · {bookedCount}/{slot.capacity}
            </div>
          </>
        )}
      </button>
    );
  };

  // Mobile date strip
  const DateStrip = () => (
    <div style={{
      display: "flex",
      gap: 6,
      overflowX: "auto",
      padding: "4px 0",
      marginBottom: 16,
      WebkitOverflowScrolling: "touch",
      scrollbarWidth: "none",
      msOverflowStyle: "none",
    }}>
      <style>{`.date-strip::-webkit-scrollbar { display: none; }`}</style>
      {weekDays.map(date => {
        const isSelected = date === selectedDay;
        const isToday = date === today;
        const blocked = isDateBlocked(date);
        const daySlots = getSlotsForDate(date);
        const hasBookings = daySlots.some(s => (s.attendees?.filter(a => a.status !== "cancelled").length || 0) > 0);

        return (
          <button
            key={date}
            onClick={() => goToDate(date)}
            className="date-strip"
            style={{
              minWidth: 48,
              padding: "10px 8px",
              background: isSelected ? "#1c1917" : blocked ? "#fef2f2" : "white",
              border: isSelected
                ? "2px solid #1c1917"
                : isToday
                  ? "2px solid #c9251c"
                  : blocked
                    ? "2px solid #fecaca"
                    : "1px solid #e7e5e4",
              borderRadius: 10,
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              position: "relative",
            }}
          >
            <span style={{
              fontSize: 11,
              fontWeight: 500,
              color: isSelected ? "#a8a29e" : blocked ? "#991b1b" : "#78716c",
              textTransform: "uppercase",
            }}>
              {DAY_NAMES_SHORT[new Date(`${date}T00:00:00.000Z`).getUTCDay()]}
            </span>
            <span style={{
              fontSize: 18,
              fontWeight: 700,
              color: isSelected ? "white" : blocked ? "#991b1b" : isToday ? "#c9251c" : "#1c1917",
            }}>
              {formatDateLabel(date)}
            </span>
            {hasBookings && !isSelected && (
              <span style={{
                position: "absolute",
                bottom: 6,
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#22c55e",
              }} />
            )}
          </button>
        );
      })}
    </div>
  );

  // Day view content
  const DayView = () => {
    const daySlots = getSlotsForDate(selectedDay);
    const blocked = isDateBlocked(selectedDay);
    const reason = getBlockReason(selectedDay);
    const isPast = selectedDay < today;

    return (
      <div style={{ opacity: isPast ? 0.5 : 1 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: "#1c1917", marginBottom: 16 }}>
          {formatFullDate(selectedDay)}
        </div>

        {blocked ? (
          <div style={{
            padding: 24,
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: 12,
            textAlign: "center",
          }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>🚫</div>
            <div style={{ fontWeight: 600, color: "#991b1b", marginBottom: 4 }}>Day Blocked</div>
            {reason && <div style={{ fontSize: 13, color: "#b91c1c" }}>{reason}</div>}
          </div>
        ) : daySlots.length === 0 ? (
          <div style={{
            padding: 32,
            background: "#fafaf9",
            border: "1px solid #e7e5e4",
            borderRadius: 12,
            textAlign: "center",
          }}>
            <div style={{ fontSize: 13, color: "#78716c" }}>No sessions scheduled</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {daySlots.map(slot => (
              <SlotCard key={slot.sessionId} slot={slot} date={selectedDay} />
            ))}
          </div>
        )}
      </div>
    );
  };

  // Week view (desktop)
  const WeekView = () => (
    <div style={{ overflowX: "auto" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(120px, 1fr))", gap: 8, minWidth: 840 }}>
        {weekDays.map(date => {
          const daySlots = getSlotsForDate(date);
          const blocked = isDateBlocked(date);
          const isToday = date === today;
          const isPast = date < today;

          return (
            <div key={date} style={{
              background: blocked ? "#fef2f2" : isToday ? "#fffbeb" : "#fafaf9",
              borderRadius: 8,
              border: isToday ? "2px solid #c9251c" : blocked ? "2px solid #fecaca" : "1px solid #e7e5e4",
              padding: 12,
              opacity: isPast ? 0.5 : 1,
            }}>
              <div style={{ marginBottom: 12, textAlign: "center" }}>
                <div style={{ fontSize: 12, color: blocked ? "#991b1b" : "#78716c", textTransform: "uppercase" }}>
                  {DAY_NAMES[new Date(`${date}T00:00:00.000Z`).getUTCDay()]}
                </div>
                <div style={{ fontSize: 24, fontWeight: 700, color: blocked ? "#991b1b" : isToday ? "#c9251c" : "#1c1917" }}>
                  {formatDateLabel(date)}
                </div>
              </div>

              {blocked && (
                <div style={{ padding: "6px 8px", background: "#fee2e2", borderRadius: 6, fontSize: 12, color: "#991b1b", textAlign: "center", marginBottom: 8 }}>
                  Blocked
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {daySlots.map(slot => (
                  <SlotCard key={slot.sessionId} slot={slot} date={date} compact />
                ))}
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
  );

  // Month view
  const MonthView = () => (
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
          const blocked = isDateBlocked(date);
          const isToday = date === today;
          const isPast = date < today;
          const totalBooked = daySlots.reduce((sum, s) => sum + (s.attendees?.filter(a => a.status !== "cancelled").length || 0), 0);
          const totalCap = daySlots.reduce((sum, s) => sum + s.capacity, 0);
          const hasBookings = totalBooked > 0;

          return (
            <button
              key={date}
              onClick={() => goToDate(date)}
              style={{
                aspectRatio: "1",
                background: outside ? "transparent" : blocked ? "#fef2f2" : hasBookings ? "rgba(34, 197, 94, 0.06)" : "white",
                border: outside ? "none" : isToday ? "2px solid #c9251c" : blocked ? "1px solid #fecaca" : "1px solid #e7e5e4",
                borderRadius: 8,
                padding: 8,
                opacity: outside ? 0.3 : isPast ? 0.5 : 1,
                display: "flex",
                flexDirection: "column",
                cursor: outside ? "default" : "pointer",
                textAlign: "left",
              }}
            >
              <div style={{ fontSize: 14, fontWeight: isToday ? 700 : 500, color: blocked ? "#991b1b" : isToday ? "#c9251c" : "#1c1917" }}>
                {formatDateLabel(date)}
              </div>
              {!outside && daySlots.length > 0 && (
                <div style={{
                  marginTop: "auto",
                  fontSize: 11,
                  color: hasBookings ? "#166534" : "#78716c",
                  fontWeight: hasBookings ? 600 : 400,
                }}>
                  {totalBooked}/{totalCap}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div>
      <div className="adm-page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1>Schedule</h1>
          <p>View and manage your training sessions</p>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            className={`adm-filter-btn ${viewMode === "day" ? "active" : ""}`}
            onClick={() => setViewMode("day")}
          >
            Day
          </button>
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button className="adm-btn adm-btn-secondary" style={{ padding: "8px 12px" }} onClick={prevPeriod}>&larr;</button>
            <button className="adm-btn adm-btn-secondary" style={{ padding: "8px 12px" }} onClick={nextPeriod}>&rarr;</button>
            <button className="adm-btn adm-btn-secondary" style={{ padding: "8px 12px" }} onClick={goToday}>Today</button>
          </div>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "#1c1917", margin: 0 }}>
            {viewMode === "day"
              ? formatFullDate(selectedDay)
              : viewMode === "week"
                ? `Week of ${new Date(`${weekStart}T00:00:00.000Z`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                : `${MONTH_NAMES[viewDate.month]} ${viewDate.year}`
            }
          </h2>
        </div>

        {/* Mobile date strip for day view */}
        {viewMode === "day" && <DateStrip />}

        {loading ? (
          <div className="adm-empty">
            <div className="adm-spinner" style={{ margin: "0 auto" }} />
          </div>
        ) : viewMode === "day" ? (
          <DayView />
        ) : viewMode === "week" ? (
          <WeekView />
        ) : (
          <MonthView />
        )}
      </div>

      {/* Legend */}
      <div style={{ marginTop: 16, padding: 16, background: "white", border: "1px solid #e7e5e4", borderRadius: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#78716c", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>Legend</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, fontSize: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 16, height: 16, borderLeft: "4px solid #3b82f6", background: "#fafaf9", borderRadius: 3 }} />
            <span style={{ color: "#57534e" }}>Group Class</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 16, height: 16, borderLeft: "4px solid #c9251c", background: "#fafaf9", borderRadius: 3 }} />
            <span style={{ color: "#57534e" }}>1:1 PT</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e" }} />
            <span style={{ color: "#57534e" }}>Has Bookings</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 16, height: 16, borderLeft: "4px solid #a855f7", background: "#f3e8ff", borderRadius: 3 }} />
            <span style={{ color: "#57534e" }}>Standing Client</span>
          </div>
        </div>
      </div>

      {/* Slot detail modal */}
      {selectedSlot && !rescheduleMode && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: 16,
        }} onClick={closeModal}>
          <div className="adm-card" style={{ maxWidth: 440, width: "100%", maxHeight: "90vh", overflow: "auto" }} onClick={e => e.stopPropagation()}>
            <div className="adm-card-header" style={{ marginBottom: 16 }}>
              <div>
                <h2 className="adm-card-title" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  {selectedSlot.standingClient && <span>🔁</span>}
                  {selectedSlot.time}
                </h2>
                <div style={{ fontSize: 13, color: "#78716c" }}>
                  {formatFullDate(selectedSlot.date)}
                </div>
              </div>
              <button onClick={closeModal} style={{ background: "none", border: "none", cursor: "pointer", color: "#78716c", fontSize: 24, lineHeight: 1 }}>
                &times;
              </button>
            </div>

            {actionError && (
              <div style={{ padding: 12, background: "#fef2f2", borderRadius: 8, color: "#991b1b", fontSize: 13, marginBottom: 16 }}>
                {actionError}
              </div>
            )}

            {selectedSlot.standingClient ? (
              <>
                <div style={{
                  padding: 16,
                  background: "#f3e8ff",
                  borderRadius: 10,
                  marginBottom: 16,
                  border: "1px solid #e9d5ff",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                    <div style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      background: "#7c3aed",
                      color: "#fff",
                      display: "grid",
                      placeItems: "center",
                      fontSize: 15,
                      fontWeight: 600,
                    }}>
                      {getInitials(selectedSlot.standingClient.memberName)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: "#581c87", fontSize: 15 }}>{selectedSlot.standingClient.memberName}</div>
                      <div style={{ fontSize: 12, color: "#7c3aed" }}>Standing Client · 1:1 PT</div>
                    </div>
                  </div>
                  {selectedSlot.standingClient.memberEmail && (
                    <div style={{ fontSize: 13, color: "#6b21a8" }}>{selectedSlot.standingClient.memberEmail}</div>
                  )}
                  <div style={{ fontSize: 13, color: "#6b21a8", marginTop: 8 }}>
                    Every {selectedSlot.standingClient.daysLabel} · {selectedSlot.standingClient.endDate ? `Until ${selectedSlot.standingClient.endDate}` : "Ongoing"}
                  </div>
                </div>
                <a
                  href="/admin/standing-clients"
                  className="adm-btn adm-btn-secondary"
                  style={{ width: "100%", textAlign: "center", textDecoration: "none" }}
                >
                  Manage Standing Clients
                </a>
              </>
            ) : (
              <>
                <div style={{
                  padding: "10px 14px",
                  background: selectedSlot.type === "GROUP" ? "#eff6ff" : "#fef2f2",
                  borderRadius: 8,
                  marginBottom: 16,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}>
                  <div style={{
                    width: 8,
                    height: 24,
                    borderRadius: 4,
                    background: selectedSlot.type === "GROUP" ? "#3b82f6" : "#c9251c",
                  }} />
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#1c1917" }}>
                    {selectedSlot.type === "GROUP" ? "Group Class" : "1:1 Personal Training"}
                  </div>
                </div>

                <div style={{ fontWeight: 600, marginBottom: 12 }}>
                  Bookings ({(selectedSlot.attendees?.filter(a => a.status !== "cancelled").length || 0)}/{selectedSlot.capacity})
                </div>

                {(selectedSlot.attendees?.filter(a => a.status !== "cancelled").length || 0) === 0 ? (
                  <p style={{ color: "#78716c", fontSize: 14, padding: 16, background: "#fafaf9", borderRadius: 8, textAlign: "center" }}>
                    No bookings yet
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {selectedSlot.attendees?.filter(a => a.status !== "cancelled").map(booking => (
                      <div key={booking.bookingId} style={{
                        padding: 14,
                        background: "#fafaf9",
                        borderRadius: 8,
                        border: "1px solid #e7e5e4",
                      }}>
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                          <div>
                            <div style={{ fontWeight: 600, color: "#1c1917", marginBottom: 2 }}>{booking.name}</div>
                            <div style={{ fontSize: 13, color: "#78716c" }}>{booking.email}</div>
                            {booking.phone && <div style={{ fontSize: 12, color: "#a8a29e", marginTop: 2 }}>{booking.phone}</div>}
                            <div style={{ fontSize: 11, color: "#a8a29e", marginTop: 4 }}>{booking.ref}</div>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                          <button
                            onClick={() => startReschedule({ ...booking, sessionType: selectedSlot.type })}
                            disabled={actionLoading}
                            style={{
                              flex: 1,
                              padding: "8px 12px",
                              background: "white",
                              border: "1px solid #e7e5e4",
                              borderRadius: 6,
                              fontSize: 13,
                              fontWeight: 500,
                              color: "#1c1917",
                              cursor: "pointer",
                            }}
                          >
                            Reschedule
                          </button>
                          <button
                            onClick={() => handleCancelBooking(booking.bookingId)}
                            disabled={actionLoading}
                            style={{
                              flex: 1,
                              padding: "8px 12px",
                              background: "#fef2f2",
                              border: "1px solid #fecaca",
                              borderRadius: 6,
                              fontSize: 13,
                              fontWeight: 500,
                              color: "#991b1b",
                              cursor: "pointer",
                            }}
                          >
                            {actionLoading ? "..." : "Cancel"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Reschedule picker modal */}
      {rescheduleMode && selectedBooking && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: 16,
        }} onClick={closeModal}>
          <div className="adm-card" style={{ maxWidth: 480, width: "100%", maxHeight: "85vh", overflow: "auto" }} onClick={e => e.stopPropagation()}>
            <div className="adm-card-header" style={{ marginBottom: 16 }}>
              <div>
                <h2 className="adm-card-title">Reschedule Booking</h2>
                <div style={{ fontSize: 13, color: "#78716c", marginTop: 4 }}>
                  {selectedBooking.name} · {selectedBooking.ref}
                </div>
              </div>
              <button onClick={closeModal} style={{ background: "none", border: "none", cursor: "pointer", color: "#78716c", fontSize: 24, lineHeight: 1 }}>
                &times;
              </button>
            </div>

            {actionError && (
              <div style={{ padding: 12, background: "#fef2f2", borderRadius: 8, color: "#991b1b", fontSize: 13, marginBottom: 16 }}>
                {actionError}
              </div>
            )}

            <div style={{ fontSize: 13, color: "#78716c", marginBottom: 16 }}>
              Select a new time for this {selectedBooking.sessionType === "GROUP" ? "group class" : "PT session"}:
            </div>

            {rescheduleSlots.length === 0 ? (
              <div style={{ padding: 24, background: "#fafaf9", borderRadius: 8, textAlign: "center", color: "#78716c" }}>
                No available slots in the next 30 days
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 400, overflow: "auto" }}>
                {rescheduleSlots.slice(0, 20).map(slot => (
                  <button
                    key={slot.sessionId}
                    onClick={() => completeReschedule(slot.sessionId)}
                    disabled={actionLoading}
                    style={{
                      padding: "12px 14px",
                      background: "white",
                      border: "1px solid #e7e5e4",
                      borderRadius: 8,
                      cursor: "pointer",
                      textAlign: "left",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: "#1c1917" }}>
                        {new Date(`${slot.date}T00:00:00.000Z`).toLocaleDateString("en-US", { timeZone: "UTC", weekday: "short", month: "short", day: "numeric" })}
                      </div>
                      <div style={{ fontSize: 13, color: "#78716c" }}>{slot.time} · {slot.spotsLeft} spot{slot.spotsLeft !== 1 ? "s" : ""} left</div>
                    </div>
                    <span style={{ color: "#c9251c", fontSize: 14 }}>→</span>
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={closeModal}
              className="adm-btn adm-btn-secondary"
              style={{ width: "100%", marginTop: 16 }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .adm-page-header {
            flex-direction: column !important;
            align-items: stretch !important;
          }
          .adm-page-header > div:last-child {
            justify-content: stretch;
          }
          .adm-filter-btn {
            flex: 1;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}
