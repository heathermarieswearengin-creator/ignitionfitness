"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { studioNow } from "@/lib/config";
import { googleCalendarUrl } from "@/lib/ics";
import { Theme } from "@/app/theme";

const CLASS_MAP = {
  group: { label: "Group Class" },
  pt: { label: "1:1 Personal Training" },
  GROUP: { label: "Group Class" },
  PT: { label: "1:1 Personal Training" },
};

const fmtDate = (iso) => {
  const d = new Date(`${iso}T00:00:00Z`);
  const dow = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getUTCDay()];
  const mon = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][d.getUTCMonth()];
  return `${dow}, ${mon} ${d.getUTCDate()}`;
};

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// Icons
const Bell = ({ s = 22 }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M9 6a3 3 0 1 1 6 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M12 8c-3.5 0-6 2.8-6 6.5C6 18 8.7 21 12 21s6-3 6-6.5C18 10.8 15.5 8 12 8z" stroke="currentColor" strokeWidth="2"/></svg>);
const User = ({ s = 22 }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/><path d="M4 21c0-4 3.5-6 8-6s8 2 8 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>);
const Lock = ({ s = 26 }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="2"/></svg>);
const CalendarIcon = ({ s = 16 }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="17" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M3 9h18M8 3v3M16 3v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>);
const Arrow = ({ s = 16 }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>);
const ChevronDown = ({ s = 16 }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 9l6 6 6-6"/></svg>);
const DownloadIcon = ({ s = 14 }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>);

export default function SessionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const user = session?.user ?? null;

  const [data, setData] = useState({ upcoming: [], past: [] });
  const [loading, setLoading] = useState(true);

  // Reschedule state
  const [rescheduleBooking, setRescheduleBooking] = useState(null);
  const [rescheduleStep, setRescheduleStep] = useState(1);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [slots, setSlots] = useState([]);
  const [slotsLoaded, setSlotsLoaded] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => {
    const now = studioNow();
    const d = new Date(now.isoDay + "T00:00:00.000Z");
    return { year: d.getUTCFullYear(), month: d.getUTCMonth() };
  });
  const [rescheduling, setRescheduling] = useState(false);
  const [rescheduleError, setRescheduleError] = useState(null);
  const [rescheduleSuccess, setRescheduleSuccess] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);

  // Cancel state
  const [cancelBooking, setCancelBooking] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState(null);

  // Expanded session in compact cards
  const [expandedSession, setExpandedSession] = useState(null);

  const reload = React.useCallback(() => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    fetch("/api/me/bookings")
      .then((r) => (r.ok ? r.json() : { upcoming: [], past: [] }))
      .then(setData)
      .catch(() => setData({ upcoming: [], past: [] }))
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => { reload(); }, [reload]);

  // Load slots for reschedule
  const loadSlots = React.useCallback(async () => {
    if (!rescheduleBooking) return;
    setSlotsLoaded(false);
    const firstDay = new Date(Date.UTC(viewMonth.year, viewMonth.month, 1));
    const lastDay = new Date(Date.UTC(viewMonth.year, viewMonth.month + 2, 0));
    const from = firstDay.toISOString().slice(0, 10);
    const to = lastDay.toISOString().slice(0, 10);
    try {
      const res = await fetch("/api/availability?from=" + from + "&to=" + to);
      setSlots(res.ok ? await res.json() : []);
    } catch { setSlots([]); }
    finally { setSlotsLoaded(true); }
  }, [rescheduleBooking, viewMonth]);

  useEffect(() => { if (rescheduleBooking) loadSlots(); }, [loadSlots, rescheduleBooking]);

  const todayIso = studioNow().isoDay;

  // Calendar helpers
  const calendarDays = useMemo(() => {
    const firstOfMonth = new Date(Date.UTC(viewMonth.year, viewMonth.month, 1));
    const lastOfMonth = new Date(Date.UTC(viewMonth.year, viewMonth.month + 1, 0));
    const startPad = firstOfMonth.getUTCDay();
    const totalDays = lastOfMonth.getUTCDate();
    const days = [];
    for (let i = 0; i < startPad; i++) days.push({ date: new Date(Date.UTC(viewMonth.year, viewMonth.month, 1 - (startPad - i))), outside: true });
    for (let i = 1; i <= totalDays; i++) days.push({ date: new Date(Date.UTC(viewMonth.year, viewMonth.month, i)), outside: false });
    while (days.length < 42) { const last = days[days.length - 1].date; days.push({ date: new Date(last.getTime() + 86400000), outside: true }); }
    return days;
  }, [viewMonth]);

  const classType = rescheduleBooking?.classType;
  const slotsForDate = (d) => slots.filter((s) => s.date === d && s.classType === classType && s.spotsLeft > 0);
  const dayHasSlots = (d) => slots.some((s) => s.date === d && s.classType === classType && s.spotsLeft > 0);
  const getOtherBookingsForDate = (dateIso) => data.upcoming.filter(b => b.date === dateIso && b.status !== "cancelled" && b.id !== rescheduleBooking?.id);
  const hasOtherBookingOnDate = (dateIso) => getOtherBookingsForDate(dateIso).length > 0;
  const prevMonth = () => { setViewMonth(v => { const d = new Date(Date.UTC(v.year, v.month - 1, 1)); return { year: d.getUTCFullYear(), month: d.getUTCMonth() }; }); };
  const nextMonth = () => { setViewMonth(v => { const d = new Date(Date.UTC(v.year, v.month + 1, 1)); return { year: d.getUTCFullYear(), month: d.getUTCMonth() }; }); };

  const openReschedule = (b) => {
    setRescheduleBooking(b);
    setRescheduleStep(1);
    setSelectedSlot(null);
    setSelectedDate(null);
    setRescheduleError(null);
    setRescheduleSuccess(null);
  };

  const closeReschedule = () => {
    setRescheduleBooking(null);
    setSelectedSlot(null);
    setSelectedDate(null);
    setRescheduleStep(1);
    setRescheduleError(null);
    setRescheduleSuccess(null);
  };

  const confirmReschedule = async () => {
    if (!selectedSlot || !rescheduleBooking || rescheduling) return;
    setRescheduling(true);
    setRescheduleError(null);
    try {
      const res = await fetch(`/api/me/bookings/${rescheduleBooking.id}/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newSessionId: selectedSlot.sessionId }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData?.error || "Could not reschedule");
      setRescheduleSuccess(resData);
      reload();
    } catch (e) {
      setRescheduleError(e.message);
    } finally {
      setRescheduling(false);
    }
  };

  const openCancel = (b) => { setCancelBooking(b); setCancelError(null); };
  const closeCancel = () => { setCancelBooking(null); setCancelError(null); };

  const confirmCancel = async () => {
    if (!cancelBooking || cancelling) return;
    setCancelling(true);
    setCancelError(null);
    try {
      const res = await fetch(`/api/me/bookings/${cancelBooking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData?.error || "Could not cancel");
      closeCancel();
      reload();
    } catch (e) {
      setCancelError(e.message);
    } finally {
      setCancelling(false);
    }
  };

  // Featured session card component
  const FeaturedSessionCard = ({ b }) => (
    <div style={{
      background: "linear-gradient(145deg, #1d1411 0%, #281a15 100%)",
      border: "2px solid #c9251c",
      borderRadius: 18,
      overflow: "hidden",
      boxShadow: "0 4px 24px rgba(201,37,28,.15)"
    }}>
      <div style={{ padding: "14px 20px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", justifyContent: "space-between" }}>
          <span style={{
            fontFamily: "var(--mono)", fontSize: 10, fontWeight: 700, letterSpacing: ".16em",
            textTransform: "uppercase", color: "#f0ab33",
            background: "rgba(240,171,51,.12)", padding: "6px 12px", borderRadius: 20
          }}>Next Session</span>
          <span style={{
            fontFamily: "var(--mono)", fontSize: 10, fontWeight: 600, letterSpacing: ".08em",
            textTransform: "uppercase", padding: "6px 12px", borderRadius: 20,
            background: b.status === "confirmed" ? "rgba(34,197,94,.15)" : "rgba(251,191,36,.15)",
            color: b.status === "confirmed" ? "#22c55e" : "#fbbf24"
          }}>{b.status.replace("-", " ")}</span>
        </div>
      </div>
      <div style={{ padding: 20, display: "flex", alignItems: "center", gap: 18 }}>
        <div style={{
          width: 56, height: 56, minWidth: 56, borderRadius: 14,
          display: "grid", placeItems: "center",
          background: "linear-gradient(150deg, rgba(224,45,36,.22), rgba(150,22,16,.08))",
          color: "#f0ab33"
        }}>
          {b.classType === "GROUP" || b.classType === "group" ? <Bell s={28} /> : <User s={28} />}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#f3ece1", marginBottom: 4 }}>
            {CLASS_MAP[b.classType?.toLowerCase()]?.label ?? CLASS_MAP[b.classType]?.label ?? b.classType}
          </div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 13, color: "#b0a193", letterSpacing: ".02em" }}>
            {fmtDate(b.date)} · {b.time}
          </div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, padding: "0 20px 16px" }}>
        <button onClick={() => openReschedule(b)} style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
          fontFamily: "var(--mono)", fontSize: 12, fontWeight: 600, letterSpacing: ".05em",
          textTransform: "uppercase", padding: "12px 16px", borderRadius: 10,
          cursor: "pointer", background: "transparent", border: "1.5px solid #3a261d", color: "#f3ece1"
        }}>
          <CalendarIcon s={16} />
          <span>Reschedule</span>
        </button>
        <button onClick={() => openCancel(b)} style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
          fontFamily: "var(--mono)", fontSize: 12, fontWeight: 600, letterSpacing: ".05em",
          textTransform: "uppercase", padding: "12px 16px", borderRadius: 10,
          cursor: "pointer", background: "rgba(239,68,68,.08)", border: "1.5px solid rgba(239,68,68,.3)", color: "#ef4444"
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>
          <span>Cancel</span>
        </button>
      </div>
      <div style={{ height: 1, background: "#3a261d", margin: "0 20px" }}></div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 24, padding: "16px 20px" }}>
        <a href={googleCalendarUrl(b)} target="_blank" rel="noopener noreferrer" style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          fontFamily: "var(--mono)", fontSize: 12, fontWeight: 500, letterSpacing: ".03em",
          color: "#b0a193", textDecoration: "none", padding: "6px 0"
        }}>
          <CalendarIcon s={16} />
          <span>Google Calendar</span>
        </a>
        <a href={`/api/bookings/${b.id}/ics`} style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          fontFamily: "var(--mono)", fontSize: 12, fontWeight: 500, letterSpacing: ".03em",
          color: "#b0a193", textDecoration: "none", padding: "6px 0"
        }}>
          <DownloadIcon s={16} />
          <span>Download .ics</span>
        </a>
      </div>
    </div>
  );

  // Compact session card for other upcoming sessions
  const CompactSessionCard = ({ b, isExpanded, onToggle }) => (
    <div style={{
      background: "#1d1411", border: "1.5px solid #3a261d", borderRadius: 14,
      overflow: "hidden", borderColor: isExpanded ? "rgba(224,45,36,.4)" : "#3a261d"
    }}>
      <button onClick={onToggle} style={{
        display: "flex", alignItems: "center", gap: 14, width: "100%", padding: "16px 18px",
        background: "transparent", border: "none", cursor: "pointer", textAlign: "left"
      }}>
        <div style={{
          width: 42, height: 42, minWidth: 42, borderRadius: 11,
          display: "grid", placeItems: "center",
          background: "rgba(240,171,51,.1)", color: "#b0a193"
        }}>
          {b.classType === "GROUP" || b.classType === "group" ? <Bell s={20} /> : <User s={20} />}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#f3ece1", marginBottom: 2 }}>
            {CLASS_MAP[b.classType?.toLowerCase()]?.label ?? CLASS_MAP[b.classType]?.label ?? b.classType}
          </div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "#78716c", letterSpacing: ".02em" }}>
            {fmtDate(b.date)} · {b.time}
          </div>
        </div>
        <span style={{
          fontFamily: "var(--mono)", fontSize: 10, fontWeight: 600,
          textTransform: "uppercase", padding: "5px 10px", borderRadius: 20,
          background: b.status === "confirmed" ? "rgba(34,197,94,.12)" : "rgba(251,191,36,.12)",
          color: b.status === "confirmed" ? "#22c55e" : "#fbbf24"
        }}>{b.status.replace("-", " ")}</span>
        <div style={{ color: "#78716c", transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform .2s" }}>
          <ChevronDown s={18} />
        </div>
      </button>
      {isExpanded && (
        <div style={{ padding: "0 18px 16px", borderTop: "1px solid #281a15", paddingTop: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            <button onClick={() => openReschedule(b)} style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
              fontFamily: "var(--mono)", fontSize: 11, fontWeight: 600, letterSpacing: ".05em",
              textTransform: "uppercase", padding: "10px 12px", borderRadius: 10,
              cursor: "pointer", background: "transparent", border: "1.5px solid #3a261d", color: "#f3ece1"
            }}>
              <CalendarIcon s={14} />
              <span>Reschedule</span>
            </button>
            <button onClick={() => openCancel(b)} style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
              fontFamily: "var(--mono)", fontSize: 11, fontWeight: 600, letterSpacing: ".05em",
              textTransform: "uppercase", padding: "10px 12px", borderRadius: 10,
              cursor: "pointer", background: "rgba(239,68,68,.08)", border: "1.5px solid rgba(239,68,68,.3)", color: "#ef4444"
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>
              <span>Cancel</span>
            </button>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20, paddingTop: 10, borderTop: "1px solid #281a15" }}>
            <a href={googleCalendarUrl(b)} target="_blank" rel="noopener noreferrer" style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              fontFamily: "var(--mono)", fontSize: 11, fontWeight: 500,
              color: "#b0a193", textDecoration: "none"
            }}>
              <CalendarIcon s={14} />
              <span>Google</span>
            </a>
            <a href={`/api/bookings/${b.id}/ics`} style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              fontFamily: "var(--mono)", fontSize: 11, fontWeight: 500,
              color: "#b0a193", textDecoration: "none"
            }}>
              <DownloadIcon s={14} />
              <span>.ics</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );

  // Past session card (no actions)
  const PastSessionCard = ({ b }) => (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14,
      background: "#1d1411", border: "1px solid #281a15", borderRadius: 12,
      padding: "14px 16px", opacity: 0.7
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10, display: "grid", placeItems: "center",
          background: "#281a15", color: "#78716c"
        }}>
          {b.classType === "GROUP" || b.classType === "group" ? <Bell s={18} /> : <User s={18} />}
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#b0a193", marginBottom: 2 }}>
            {CLASS_MAP[b.classType?.toLowerCase()]?.label ?? CLASS_MAP[b.classType]?.label ?? b.classType}
          </div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "#78716c" }}>
            {fmtDate(b.date)} · {b.time}
          </div>
        </div>
      </div>
      <span style={{
        fontFamily: "var(--mono)", fontSize: 10, fontWeight: 600,
        textTransform: "uppercase", padding: "5px 10px", borderRadius: 20,
        background: b.status === "cancelled" ? "rgba(239,68,68,.1)" : "rgba(176,161,147,.1)",
        color: b.status === "cancelled" ? "#ef4444" : "#78716c"
      }}>{b.status.replace("-", " ")}</span>
    </div>
  );

  if (status === "loading") {
    return (
      <div className="ign">
        <Theme />
        <div className="page"><div className="wrap"><div style={{ textAlign: "center", padding: 60, color: "#b0a193" }}>Loading...</div></div></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="ign">
        <Theme />
        <div className="page"><div className="wrap"><div className="gate">
          <div className="glock"><Lock /></div>
          <h2>Sign In</h2>
          <p>Sign in to see your sessions.</p>
          <a className="btn btn-primary" style={{ width: "100%" }} href="/login?next=/sessions">Sign In</a>
        </div></div></div>
      </div>
    );
  }

  return (
    <div className="ign">
      <Theme />
      <div className="page" style={{ paddingTop: 48, paddingBottom: 60 }}>
        <div className="wrap" style={{ maxWidth: 720 }}>
          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <button
              onClick={() => router.push("/")}
              style={{
                background: "none", border: "none", color: "#b0a193",
                fontFamily: "var(--mono)", fontSize: 12, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6, marginBottom: 16
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              Back
            </button>
            <h1 style={{ fontFamily: "var(--display)", fontSize: "clamp(32px, 6vw, 44px)", textTransform: "uppercase", marginBottom: 8 }}>
              All Sessions
            </h1>
            <p style={{ color: "#b0a193", fontSize: 15 }}>Your complete session history</p>
          </div>

          {/* Upcoming Sessions */}
          <div style={{
            background: "#140d0b", border: "1.5px solid #3a261d", borderRadius: 20, marginBottom: 24
          }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "18px 22px", borderBottom: "1px solid #281a15"
            }}>
              <h2 style={{ fontFamily: "var(--display)", fontSize: 20, textTransform: "uppercase", letterSpacing: ".02em", color: "#f3ece1", margin: 0 }}>
                Upcoming
              </h2>
              {data.upcoming.length > 0 && (
                <span style={{
                  fontFamily: "var(--mono)", fontSize: 12, fontWeight: 700,
                  background: "rgba(224,45,36,.15)", color: "#f0ab33",
                  padding: "5px 12px", borderRadius: 20
                }}>{data.upcoming.length}</span>
              )}
            </div>
            <div style={{ padding: 20 }}>
              {loading && <div style={{ textAlign: "center", color: "#b0a193", padding: 32 }}>Loading...</div>}
              {!loading && data.upcoming.length === 0 && (
                <div style={{ textAlign: "center", padding: "32px 20px", color: "#78716c" }}>
                  <p style={{ marginBottom: 16 }}>No upcoming sessions</p>
                  <button onClick={() => router.push("/")} className="btn btn-primary">Book a Session</button>
                </div>
              )}
              {!loading && data.upcoming.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <FeaturedSessionCard b={data.upcoming[0]} />
                  {data.upcoming.slice(1).map((b) => (
                    <CompactSessionCard
                      key={b.id}
                      b={b}
                      isExpanded={expandedSession === b.id}
                      onToggle={() => setExpandedSession(expandedSession === b.id ? null : b.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Past & Cancelled Sessions */}
          {data.past.length > 0 && (
            <div style={{
              background: "#140d0b", border: "1.5px solid #3a261d", borderRadius: 20,
              opacity: 0.85
            }}>
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "18px 22px", borderBottom: "1px solid #281a15"
              }}>
                <h2 style={{ fontFamily: "var(--display)", fontSize: 20, textTransform: "uppercase", letterSpacing: ".02em", color: "#b0a193", margin: 0 }}>
                  Past & Cancelled
                </h2>
                <span style={{
                  fontFamily: "var(--mono)", fontSize: 12, fontWeight: 700,
                  background: "rgba(176,161,147,.1)", color: "#78716c",
                  padding: "5px 12px", borderRadius: 20
                }}>{data.past.length}</span>
              </div>
              <div style={{ padding: 20 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {data.past.map((b) => <PastSessionCard key={b.id} b={b} />)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cancel Modal */}
      {cancelBooking && (
        <div
          onClick={closeCancel}
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(0,0,0,.75)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 16, overflowY: "auto"
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "#1d1411", border: "1.5px solid #3a261d", borderRadius: 20,
              padding: "28px 24px", width: "100%", maxWidth: 400,
              position: "relative", boxShadow: "0 20px 60px rgba(0,0,0,.5)"
            }}
          >
            <button onClick={closeCancel} style={{
              position: "absolute", top: 16, right: 16,
              width: 32, height: 32, borderRadius: 8,
              background: "rgba(255,255,255,.05)", border: "none",
              color: "#78716c", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>

            <h2 style={{
              fontFamily: "var(--display)", fontSize: 24, textTransform: "uppercase",
              letterSpacing: ".02em", color: "#f3ece1", marginBottom: 20, paddingRight: 32
            }}>Cancel Session?</h2>

            <div style={{
              background: "#140d0b", border: "1px solid #281a15", borderRadius: 12,
              padding: 16, marginBottom: 20
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 11, display: "grid", placeItems: "center",
                  background: "rgba(239,68,68,.1)", color: "#ef4444"
                }}>
                  {cancelBooking.classType === "GROUP" || cancelBooking.classType === "group" ? <Bell s={22} /> : <User s={22} />}
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#f3ece1", marginBottom: 2 }}>
                    {CLASS_MAP[cancelBooking.classType?.toLowerCase()]?.label ?? cancelBooking.classType}
                  </div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 13, color: "#b0a193" }}>
                    {fmtDate(cancelBooking.date)} · {cancelBooking.time}
                  </div>
                </div>
              </div>
            </div>

            <p style={{ color: "#b0a193", fontSize: 14, lineHeight: 1.5, marginBottom: 24 }}>
              This can't be undone. The slot will be released for others to book.
            </p>

            {cancelError && (
              <div style={{
                background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.3)",
                borderRadius: 10, padding: "12px 14px", marginBottom: 20,
                color: "#ef4444", fontSize: 13, fontFamily: "var(--mono)"
              }}>{cancelError}</div>
            )}

            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={closeCancel} disabled={cancelling} style={{
                flex: 1, padding: "14px 20px", borderRadius: 10,
                fontFamily: "var(--mono)", fontSize: 12, fontWeight: 700,
                letterSpacing: ".06em", textTransform: "uppercase",
                background: "transparent", border: "1.5px solid #3a261d",
                color: "#f3ece1", cursor: "pointer",
                opacity: cancelling ? 0.5 : 1
              }}>Keep Session</button>
              <button onClick={confirmCancel} disabled={cancelling} style={{
                flex: 1, padding: "14px 20px", borderRadius: 10,
                fontFamily: "var(--mono)", fontSize: 12, fontWeight: 700,
                letterSpacing: ".06em", textTransform: "uppercase",
                background: "rgba(239,68,68,.15)", border: "1.5px solid rgba(239,68,68,.4)",
                color: "#ef4444", cursor: "pointer",
                opacity: cancelling ? 0.5 : 1
              }}>{cancelling ? "Cancelling..." : "Yes, Cancel"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleBooking && !rescheduleSuccess && (
        <div
          onClick={closeReschedule}
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(0,0,0,.85)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "flex-end", justifyContent: "center",
            overflowY: "auto"
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "#140d0b", borderTop: "1.5px solid #3a261d",
              borderRadius: "24px 24px 0 0",
              padding: "24px 20px 32px", width: "100%", maxWidth: 500,
              maxHeight: "92vh", overflowY: "auto",
              position: "relative", boxShadow: "0 -10px 40px rgba(0,0,0,.5)"
            }}
          >
            <div style={{ width: 40, height: 4, borderRadius: 2, background: "#3a261d", margin: "0 auto 20px" }}></div>

            <button onClick={closeReschedule} style={{
              position: "absolute", top: 20, right: 16,
              width: 36, height: 36, borderRadius: 10,
              background: "rgba(255,255,255,.05)", border: "none",
              color: "#78716c", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>

            {rescheduleStep === 1 && (
              <>
                <h2 style={{
                  fontFamily: "var(--display)", fontSize: 22, textTransform: "uppercase",
                  letterSpacing: ".02em", color: "#f3ece1", marginBottom: 4, paddingRight: 40
                }}>Reschedule Session</h2>

                <div style={{
                  background: "#1d1411", border: "1px solid #281a15", borderRadius: 12,
                  padding: 14, marginBottom: 20, marginTop: 16
                }}>
                  <div style={{ fontSize: 10, color: "#78716c", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 6 }}>Currently</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10, display: "grid", placeItems: "center",
                      background: "rgba(240,171,51,.1)", color: "#f0ab33"
                    }}>
                      {rescheduleBooking.classType === "GROUP" || rescheduleBooking.classType === "group" ? <Bell s={20} /> : <User s={20} />}
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: "#f3ece1" }}>
                        {CLASS_MAP[rescheduleBooking.classType?.toLowerCase()]?.label ?? rescheduleBooking.classType}
                      </div>
                      <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "#b0a193" }}>
                        {fmtDate(rescheduleBooking.date)} · {rescheduleBooking.time}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: 14, color: "#f3ece1", fontWeight: 600, marginBottom: 16 }}>Pick a new date and time:</div>

                {/* Month nav */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <button onClick={prevMonth} style={{
                    width: 40, height: 40, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
                    background: "#1d1411", border: "1px solid #3a261d", color: "#b0a193", cursor: "pointer", fontSize: 18
                  }}>←</button>
                  <div style={{ fontFamily: "var(--body)", fontSize: 16, fontWeight: 600, color: "#f3ece1" }}>
                    {monthNames[viewMonth.month]} {viewMonth.year}
                  </div>
                  <button onClick={nextMonth} style={{
                    width: 40, height: 40, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
                    background: "#1d1411", border: "1px solid #3a261d", color: "#b0a193", cursor: "pointer", fontSize: 18
                  }}>→</button>
                </div>

                {/* Calendar */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 8 }}>
                    {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                      <div key={i} style={{ textAlign: "center", fontFamily: "var(--mono)", fontSize: 11, color: "#78716c", padding: "6px 0", fontWeight: 600 }}>{d}</div>
                    ))}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
                    {calendarDays.map(({ date, outside }, i) => {
                      const isoD = date.toISOString().slice(0, 10);
                      const isPast = isoD < todayIso;
                      const hasAvail = !isPast && !outside && dayHasSlots(isoD);
                      const isSelected = selectedDate === isoD;
                      const hasOtherBooking = !outside && !isPast && hasOtherBookingOnDate(isoD);

                      let bgColor = "transparent";
                      let borderColor = "1px solid transparent";
                      let textColor = outside || isPast ? "#3a261d" : "#78716c";

                      if (isSelected) {
                        bgColor = "#c9251c";
                        borderColor = "1px solid #c9251c";
                        textColor = "#fff";
                      } else if (hasAvail && hasOtherBooking) {
                        bgColor = "rgba(34,197,94,.15)";
                        borderColor = "1px solid #22c55e";
                        textColor = "#f3ece1";
                      } else if (hasAvail) {
                        bgColor = "#1d1411";
                        borderColor = "1px solid #3a261d";
                        textColor = "#f3ece1";
                      }

                      return (
                        <button key={i} onClick={() => hasAvail && setSelectedDate(isoD)} disabled={!hasAvail} style={{
                          width: "100%", aspectRatio: "1", display: "flex", alignItems: "center", justifyContent: "center",
                          fontFamily: "var(--body)", fontSize: 14, fontWeight: isSelected ? 700 : 500,
                          background: bgColor, color: textColor, border: borderColor,
                          borderRadius: 10, cursor: hasAvail ? "pointer" : "default", opacity: outside ? 0.3 : 1,
                          position: "relative"
                        }}>
                          {date.getUTCDate()}
                          {hasOtherBooking && !isSelected && (
                            <span style={{
                              position: "absolute", bottom: 3, left: "50%", transform: "translateX(-50%)",
                              width: 5, height: 5, borderRadius: "50%", background: "#22c55e"
                            }} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginTop: 12, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 12, height: 12, borderRadius: 3, background: "#1d1411", border: "1px solid #3a261d" }} />
                      <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "#78716c" }}>Available</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ position: "relative", width: 12, height: 12, borderRadius: 3, background: "rgba(34,197,94,.15)", border: "1px solid #22c55e" }}>
                        <span style={{ position: "absolute", bottom: 1, left: "50%", transform: "translateX(-50%)", width: 4, height: 4, borderRadius: "50%", background: "#22c55e" }} />
                      </span>
                      <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "#78716c" }}>You're booked</span>
                    </div>
                  </div>
                </div>

                {/* Time slots */}
                {selectedDate && (
                  <div style={{ marginBottom: 20 }}>
                    {hasOtherBookingOnDate(selectedDate) && (
                      <div style={{
                        display: "flex", alignItems: "flex-start", gap: 10,
                        background: "rgba(34,197,94,.1)", border: "1px solid rgba(34,197,94,.3)",
                        borderRadius: 10, padding: "12px 14px", marginBottom: 12
                      }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                          <circle cx="12" cy="12" r="10" stroke="#22c55e" strokeWidth="2"/>
                          <path d="M8 12l3 3 5-6" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <div>
                          <div style={{ fontFamily: "var(--mono)", fontSize: 11, fontWeight: 600, color: "#22c55e", marginBottom: 4 }}>
                            You have another session this day
                          </div>
                          <div style={{ fontSize: 12, color: "#f3ece1" }}>
                            {getOtherBookingsForDate(selectedDate).map((b) => (
                              <div key={b.id}>{CLASS_MAP[b.classType]?.label || b.classType} · {b.time}</div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    <div style={{ fontSize: 13, color: "#b0a193", marginBottom: 12 }}>Available times for {fmtDate(selectedDate)}:</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                      {slotsForDate(selectedDate).map((s) => (
                        <button key={s.sessionId} onClick={() => setSelectedSlot(s)} style={{
                          padding: "12px 18px", borderRadius: 10, fontSize: 14, fontWeight: 600,
                          background: selectedSlot?.sessionId === s.sessionId ? "#c9251c" : "#1d1411",
                          color: selectedSlot?.sessionId === s.sessionId ? "#fff" : "#f3ece1",
                          border: selectedSlot?.sessionId === s.sessionId ? "none" : "1px solid #3a261d",
                          cursor: "pointer"
                        }}>{s.time}</button>
                      ))}
                      {slotsForDate(selectedDate).length === 0 && (
                        <div style={{ color: "#78716c", fontSize: 13 }}>No available times on this date</div>
                      )}
                    </div>
                  </div>
                )}

                {!selectedDate && !slotsLoaded && (
                  <div style={{ textAlign: "center", color: "#78716c", padding: 20 }}>Loading availability...</div>
                )}

                {rescheduleError && (
                  <div style={{
                    background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.3)",
                    borderRadius: 10, padding: "12px 14px", marginBottom: 16,
                    color: "#ef4444", fontSize: 13, fontFamily: "var(--mono)"
                  }}>{rescheduleError}</div>
                )}

                <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                  <button onClick={closeReschedule} style={{
                    flex: 1, padding: "14px 20px", borderRadius: 10,
                    fontFamily: "var(--mono)", fontSize: 12, fontWeight: 700,
                    letterSpacing: ".06em", textTransform: "uppercase",
                    background: "transparent", border: "1.5px solid #3a261d",
                    color: "#f3ece1", cursor: "pointer"
                  }}>Cancel</button>
                  <button
                    onClick={() => setRescheduleStep(2)}
                    disabled={!selectedSlot}
                    style={{
                      flex: 1, padding: "14px 20px", borderRadius: 10,
                      fontFamily: "var(--mono)", fontSize: 12, fontWeight: 700,
                      letterSpacing: ".06em", textTransform: "uppercase",
                      background: selectedSlot ? "linear-gradient(150deg, #e02d24, #c9251c)" : "#281a15",
                      border: "none", color: selectedSlot ? "#fff" : "#78716c",
                      cursor: selectedSlot ? "pointer" : "not-allowed"
                    }}
                  >Review Change</button>
                </div>
              </>
            )}

            {rescheduleStep === 2 && selectedSlot && (
              <>
                <h2 style={{
                  fontFamily: "var(--display)", fontSize: 22, textTransform: "uppercase",
                  letterSpacing: ".02em", color: "#f3ece1", marginBottom: 24, paddingRight: 40, textAlign: "center"
                }}>Confirm Reschedule</h2>

                <div style={{ display: "flex", alignItems: "center", gap: 16, justifyContent: "center", marginBottom: 24 }}>
                  <div style={{ textAlign: "center", flex: 1 }}>
                    <div style={{ fontSize: 10, color: "#78716c", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 8 }}>From</div>
                    <div style={{ fontFamily: "var(--display)", fontSize: 16, color: "#78716c", textDecoration: "line-through", marginBottom: 4 }}>
                      {fmtDate(rescheduleBooking.date)}
                    </div>
                    <div style={{ fontFamily: "var(--mono)", fontSize: 14, color: "#78716c" }}>{rescheduleBooking.time}</div>
                  </div>
                  <div style={{ color: "#f0ab33" }}><Arrow s={24} /></div>
                  <div style={{ textAlign: "center", flex: 1 }}>
                    <div style={{ fontSize: 10, color: "#f0ab33", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 8 }}>To</div>
                    <div style={{ fontFamily: "var(--display)", fontSize: 16, color: "#f3ece1", marginBottom: 4 }}>
                      {fmtDate(selectedSlot.date)}
                    </div>
                    <div style={{ fontFamily: "var(--mono)", fontSize: 14, color: "#f0ab33" }}>{selectedSlot.time}</div>
                  </div>
                </div>

                <p style={{ color: "#b0a193", fontSize: 14, textAlign: "center", marginBottom: 24 }}>
                  {CLASS_MAP[rescheduleBooking.classType?.toLowerCase()]?.label ?? rescheduleBooking.classType}
                </p>

                {rescheduleError && (
                  <div style={{
                    background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.3)",
                    borderRadius: 10, padding: "12px 14px", marginBottom: 20,
                    color: "#ef4444", fontSize: 13, fontFamily: "var(--mono)"
                  }}>{rescheduleError}</div>
                )}

                <div style={{ display: "flex", gap: 12 }}>
                  <button onClick={() => setRescheduleStep(1)} disabled={rescheduling} style={{
                    flex: 1, padding: "14px 20px", borderRadius: 10,
                    fontFamily: "var(--mono)", fontSize: 12, fontWeight: 700,
                    letterSpacing: ".06em", textTransform: "uppercase",
                    background: "transparent", border: "1.5px solid #3a261d",
                    color: "#f3ece1", cursor: "pointer",
                    opacity: rescheduling ? 0.5 : 1
                  }}>Back</button>
                  <button onClick={confirmReschedule} disabled={rescheduling} style={{
                    flex: 1, padding: "14px 20px", borderRadius: 10,
                    fontFamily: "var(--mono)", fontSize: 12, fontWeight: 700,
                    letterSpacing: ".06em", textTransform: "uppercase",
                    background: rescheduling ? "#281a15" : "linear-gradient(150deg, #e02d24, #c9251c)",
                    border: "none", color: rescheduling ? "#78716c" : "#fff",
                    cursor: rescheduling ? "not-allowed" : "pointer"
                  }}>{rescheduling ? "Rescheduling..." : "Confirm Reschedule"}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Reschedule Success */}
      {rescheduleSuccess && (
        <div
          onClick={closeReschedule}
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(0,0,0,.85)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 20
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "#140d0b", border: "1.5px solid #3a261d", borderRadius: 20,
              padding: "32px 28px", width: "100%", maxWidth: 420, textAlign: "center"
            }}
          >
            <div style={{
              width: 72, height: 72, borderRadius: "50%", margin: "0 auto 20px",
              background: "linear-gradient(150deg, #e02d24, #c9251c)",
              display: "grid", placeItems: "center",
              boxShadow: "0 0 40px rgba(224,45,36,.4)"
            }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12l4.5 4.5L19 7"/></svg>
            </div>
            <h2 style={{ fontFamily: "var(--display)", fontSize: 28, textTransform: "uppercase", marginBottom: 12 }}>Rescheduled</h2>
            <p style={{ color: "#b0a193", fontSize: 14, marginBottom: 24 }}>
              Your session has been moved to {fmtDate(rescheduleSuccess.newBooking?.date)} at {rescheduleSuccess.newBooking?.time}.
            </p>
            <button onClick={closeReschedule} className="btn btn-primary" style={{ padding: "14px 32px" }}>Done</button>
          </div>
        </div>
      )}
    </div>
  );
}
