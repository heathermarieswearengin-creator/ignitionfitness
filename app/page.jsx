"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useSession, signOut } from "next-auth/react";
import { studioNow, STUDIO } from "@/lib/config";
import { to12h } from "@/lib/shape";
import { googleCalendarUrl } from "@/lib/ics";
import { Theme } from "@/app/theme";

/* ============================================================
   IGNITION FITNESS: landing + booking + admin (single app)
   Aesthetic: "the forge". Dark charcoal, brand red and gold, heavy
   industrial type. Bookings persist in Postgres via /api/bookings,
   so the booking flow feeds the admin dashboard across devices.
   ============================================================ */


/* ---------- data / helpers ---------- */
// Presentational metadata only. The bookable schedule and per-session capacity
// now live in Postgres (WeeklyTemplate -> ClassSession) and arrive via
// /api/availability; this just supplies labels, blurbs and headline pricing.
const CLASSES = [
  { id: "group", label: "Group Class", tag: "All levels", price: 25,
    desc: "Small-group strength + cardio in 60 minutes. Drop-ins welcome." },
  { id: "pt", label: "1:1 Personal Training", tag: "Private session", price: 80,
    desc: "One-on-one coaching with Mike, tailored to your goals." },
];
const CLASS_MAP = Object.fromEntries(CLASSES.map((c) => [c.id, c]));
const DOW = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// Brand logo. Swap this data URI for a hosted file anytime (e.g. "/logo.png").
const LOGO_URL = "data:image/png;base64,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";

const iso = (d) => d.toISOString().slice(0, 10);
const toMin = (t) => { const m = t.match(/(\d+):(\d+) (\w+)/); let h = +m[1] % 12; if (m[3] === "PM") h += 12; return h * 60 + +m[2]; };

// The 14-day strip is anchored to the studio's calendar day and stepped in UTC.
// Building it from a local `new Date()` and then keying it with toISOString()
// disagreed by one day whenever local time was behind UTC midnight — the chip
// would read "30" while asking the server for the 31st.
const next14 = () => {
  const a = [];
  const start = Date.parse(`${studioNow().isoDay}T00:00:00.000Z`);
  for (let i = 0; i < 14; i++) a.push(new Date(start + i * 86400000));
  return a;
};


/* ---------- icons ---------- */
const Flame = ({ s = 18 }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 2c1 3 4 4.5 4 8a4 4 0 0 1-8 0c0-1 .5-2 1-2.5C9 9 9 11 11 11c1.5 0 2-1.5 1-4 .5.5 0 0 0-5z" fill="currentColor"/><path d="M12 22a6 6 0 0 0 6-6c0-2-1-4-2.5-5.5C16 13 14.5 14 13 14c-2.5 0-3-2.5-2-5C8 11 6 13 6 16a6 6 0 0 0 6 6z" fill="currentColor"/></svg>);
const Bell = ({ s = 22 }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M9 6a3 3 0 1 1 6 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M12 8c-3.5 0-6 2.8-6 6.5C6 18 8.7 21 12 21s6-3 6-6.5C18 10.8 15.5 8 12 8z" stroke="currentColor" strokeWidth="2"/></svg>);
const Check = ({ s = 14 }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M5 12l4.5 4.5L19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>);
const Clock = ({ s = 22 }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/><path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>);
const User = ({ s = 22 }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/><path d="M4 21c0-4 3.5-6 8-6s8 2 8 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>);
const Lock = ({ s = 26 }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="2"/></svg>);
const Arrow = ({ s = 16 }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>);
const CalendarIcon = ({ s = 16 }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="17" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M3 9h18M8 3v3M16 3v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>);

function Logo({ h = 44 }) {
  if (LOGO_URL && !LOGO_URL.includes("__")) return <img src={LOGO_URL} alt="Ignition Fitness" style={{ height: h, width: "auto", display: "block" }} />;
  return <span className="logo-word">IGNITION <b>FITNESS</b></span>;
}

/* ---------- error boundary ---------- */
class BookingErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error, info) { console.error("Booking render error:", error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="page"><div className="wrap">
          <div className="page-head"><h1>Booking Error</h1><p>Something went wrong. Please try again.</p></div>
          <div className="card" style={{ textAlign: "center", padding: 32 }}>
            <p style={{ color: "var(--ash)", marginBottom: 20 }}>We couldn't complete your booking. The session may already be full or you may already have a booking at this time.</p>
            <button className="btn btn-primary" onClick={() => { this.setState({ hasError: false }); this.props.onReset?.(); }}>Try Again</button>
            <button className="btn btn-ghost" style={{ marginLeft: 12 }} onClick={() => this.props.go?.("home")}>Back to Home</button>
          </div>
        </div></div>
      );
    }
    return this.props.children;
  }
}

/* ================= APP ================= */
export default function App() {
  const { data: session, status } = useSession();
  const user = session?.user ?? null;
  const isAdmin = user?.role === "ADMIN";

  const [view, setView] = useState("home");

  // The server owns the id, ref and capacity check, so the created booking is
  // returned to the caller rather than invented in the browser. Accepts either
  // the single-booking shape or { items: [...] } for the cart.
  const addBooking = async (input) => {
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.error || "Could not complete that booking.");
    return data;
  };

  // Lead capture is best-effort; never block the UI on it.
  const addLead = async (email, source) => {
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source }),
      });
    } catch { /* silent fail */ }
  };

  const go = (v) => { setView(v); window.scrollTo({ top: 0, behavior: "smooth" }); };

  // Logged-in users get an app-like experience (no website chrome)
  if (user) {
    return (
      <div className="ign">
        <Theme />
        <AppHeader user={user} isAdmin={isAdmin} onSignOut={() => signOut({ callbackUrl: "/" })} />
        {view === "book" ? (
          <BookingErrorBoundary key="booking-boundary" go={go}>
            <Booking addBooking={addBooking} go={go} user={user} />
          </BookingErrorBoundary>
        ) : (
          <MySessions go={go} user={user} status={status} />
        )}
      </div>
    );
  }

  // Non-logged-in users see the full marketing website
  return (
    <div className="ign">
      <Theme />
      <Nav view={view} go={go} user={user} isAdmin={isAdmin} />
      {view === "home" && <Home go={go} addLead={addLead} />}
      {view === "book" && <BookingErrorBoundary key="booking-boundary" go={go}><Booking addBooking={addBooking} go={go} user={user} /></BookingErrorBoundary>}
      <Footer go={go} />
    </div>
  );
}

/* ---------- app header (logged-in users) ---------- */
function AppHeader({ user, isAdmin, onSignOut }) {
  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 50,
      background: "rgba(12,9,8,.95)", backdropFilter: "blur(14px)",
      borderBottom: "1px solid #3a261d",
      padding: "0 20px"
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 64, maxWidth: 720, margin: "0 auto"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Logo h={38} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {isAdmin && (
            <a href="/admin" style={{
              fontFamily: "var(--mono)", fontSize: 11, fontWeight: 600,
              letterSpacing: ".08em", textTransform: "uppercase",
              color: "#f0ab33", textDecoration: "none",
              padding: "8px 12px", borderRadius: 6,
              background: "rgba(240,171,51,.1)"
            }}>Admin</a>
          )}
          <button onClick={onSignOut} style={{
            fontFamily: "var(--mono)", fontSize: 11, fontWeight: 600,
            letterSpacing: ".08em", textTransform: "uppercase",
            color: "#b0a193", background: "transparent", border: "none",
            padding: "8px 12px", borderRadius: 6, cursor: "pointer"
          }}>Sign Out</button>
        </div>
      </div>
    </header>
  );
}

/* ---------- nav ---------- */
function Nav({ view, go, user, isAdmin }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeMobile = () => setMobileOpen(false);
  const navTo = (v) => { go(v); closeMobile(); };
  
  return (
    <>
      <nav className="nav">
        <div className="wrap nav-in">
          <button className="logo" onClick={() => navTo("home")}>
            <Logo h={52} />
          </button>
          <div className="nav-links">
            <button className={"nlink" + (view === "home" ? " on" : "")} onClick={() => navTo("home")}>HOME</button>
            <button className="nlink" onClick={() => navTo("home")}>OUR STORY</button>
            <button className="nlink" onClick={() => navTo("home")}>PRICING</button>
            {user && (
              <button className={"nlink" + (view === "mine" ? " on" : "")} onClick={() => navTo("mine")}>MY SESSIONS</button>
            )}
            {isAdmin && (
              <a className="nlink" href="/admin">ADMIN</a>
            )}
            {user
              ? <button className="nlink" onClick={() => { signOut({ callbackUrl: "/" }); closeMobile(); }}>SIGN OUT</button>
              : <a className="nlink" href="/login">SIGN IN</a>}
            <button className="btn btn-primary" onClick={() => navTo("book")} style={{ marginLeft: 8 }}>Book a Class</button>
          </div>
          <button className="mobile-menu-btn" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu">
            {mobileOpen ? (
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M6 18L18 6"/></svg>
            ) : (
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
            )}
          </button>
        </div>
      </nav>
      <div className={"mobile-nav" + (mobileOpen ? " open" : "")}>
        <button className={"nlink" + (view === "home" ? " on" : "")} onClick={() => navTo("home")}>HOME</button>
        <button className="nlink" onClick={() => navTo("home")}>OUR STORY</button>
        <button className="nlink" onClick={() => navTo("home")}>PRICING</button>
        {user && (
          <button className={"nlink" + (view === "mine" ? " on" : "")} onClick={() => navTo("mine")}>MY SESSIONS</button>
        )}
        {isAdmin && (
          <a className="nlink" href="/admin" onClick={closeMobile}>ADMIN</a>
        )}
        {user
          ? <button className="nlink" onClick={() => { signOut({ callbackUrl: "/" }); closeMobile(); }}>SIGN OUT</button>
          : <a className="nlink" href="/login">SIGN IN</a>}
        <button className="btn btn-primary" onClick={() => navTo("book")} style={{ marginTop: 12, width: "100%" }}>Book a Class</button>
      </div>
    </>
  );
}

/* ---------- my sessions ---------- */
function MySessions({ go, user, status }) {
  const [data, setData] = useState({ upcoming: [], past: [] });
  const [loading, setLoading] = useState(true);

  // Reschedule state
  const [rescheduleBooking, setRescheduleBooking] = useState(null);
  const [rescheduleStep, setRescheduleStep] = useState(1); // 1=pick date/time, 2=confirm
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

  // Cancel state
  const [cancelBooking, setCancelBooking] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState(null);
  const [cancelSuccess, setCancelSuccess] = useState(false);

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

  // Load slots when reschedule modal opens
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

  const openReschedule = (b) => {
    setRescheduleBooking(b);
    setRescheduleStep(1);
    setSelectedSlot(null);
    setRescheduleError(null);
    setRescheduleSuccess(null);
  };

  const closeReschedule = () => {
    setRescheduleBooking(null);
    setSelectedSlot(null);
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
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Could not reschedule");
      setRescheduleSuccess(data);
      reload();
    } catch (e) {
      setRescheduleError(e.message);
    } finally {
      setRescheduling(false);
    }
  };

  const openCancel = (b) => {
    setCancelBooking(b);
    setCancelError(null);
  };

  const closeCancel = () => {
    setCancelBooking(null);
    setCancelError(null);
  };

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
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Could not cancel");
      closeCancel();
      reload();
      // Show success toast
      setCancelSuccess(true);
      setTimeout(() => setCancelSuccess(false), 3000);
    } catch (e) {
      setCancelError(e.message);
    } finally {
      setCancelling(false);
    }
  };

  if (status === "loading") return <div className="page"><div className="wrap"><div className="empty">Loading…</div></div></div>;

  if (!user) {
    return (
      <div className="page"><div className="wrap"><div className="gate">
        <div className="glock"><Lock /></div>
        <h2>Sign In</h2>
        <p>Sign in to see the sessions you have booked.</p>
        <a className="btn btn-primary" style={{ width: "100%" }} href="/login?next=/">Sign In</a>
      </div></div></div>
    );
  }

  const firstName = user.name?.split(" ")[0] || "athlete";
  const todayIso = studioNow().isoDay;
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  // Calendar helpers for reschedule modal
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
  const prevMonth = () => { setViewMonth(v => { const d = new Date(Date.UTC(v.year, v.month - 1, 1)); return { year: d.getUTCFullYear(), month: d.getUTCMonth() }; }); };
  const nextMonth = () => { setViewMonth(v => { const d = new Date(Date.UTC(v.year, v.month + 1, 1)); return { year: d.getUTCFullYear(), month: d.getUTCMonth() }; }); };
  const [selectedDate, setSelectedDate] = useState(null);
  const [showAllSessions, setShowAllSessions] = useState(false);
  const [expandedSession, setExpandedSession] = useState(null);

  // Icons for session cards
  const DownloadIcon = ({ s = 14 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
    </svg>
  );
  const ChevronDown = ({ s = 16 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M6 9l6 6 6-6"/>
    </svg>
  );

  // Featured "Next Session" card - prominent styling with inline fallbacks
  const FeaturedSessionCard = ({ b }) => (
    <div className="featured-session-card" style={{
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

  // Compact card for secondary sessions with inline styles
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

  return (
    <div className="page my-sessions-page"><div className="wrap my-sessions-wrap">
      {/* Greeting */}
      <div className="my-sessions-greeting">
        <span className="greeting-label">Welcome back</span>
        <h1 className="greeting-name">{firstName}</h1>
      </div>

      {/* Action cards */}
      <div className="my-sessions-actions" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12, marginBottom: 32 }}>
        <button
          className="ms-action-card primary"
          onClick={() => go("book")}
          style={{
            display: "flex", flexDirection: "row", alignItems: "center", gap: 16,
            width: "100%", textAlign: "left", padding: "18px 20px",
            background: "linear-gradient(135deg, #e02d24, #c9251c)",
            border: "none", borderRadius: 14, color: "#f3ece1",
            cursor: "pointer", WebkitAppearance: "none"
          }}
        >
          <div style={{ width: 48, height: 48, minWidth: 48, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.12)" }}>
            <Flame s={28} />
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontFamily: "var(--display)", fontSize: 17, textTransform: "uppercase", lineHeight: 1.2 }}>Book a Session</span>
            <span style={{ fontSize: 12, opacity: 0.8 }}>Find your next class or 1:1</span>
          </div>
        </button>
        <button
          className="ms-action-card"
          onClick={() => {
            const el = document.getElementById("upcoming");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }}
          style={{
            display: "flex", flexDirection: "row", alignItems: "center", gap: 16,
            width: "100%", textAlign: "left", padding: "18px 20px",
            background: "#1d1411", border: "2px solid #3a261d", borderRadius: 14,
            color: "#f3ece1", cursor: "pointer", WebkitAppearance: "none"
          }}
        >
          <div style={{ width: 48, height: 48, minWidth: 48, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(224,45,36,0.12)", color: "#f0ab33" }}>
            <Clock s={28} />
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontFamily: "var(--display)", fontSize: 17, textTransform: "uppercase", lineHeight: 1.2 }}>View All Sessions</span>
            <span style={{ fontSize: 12, color: "#b0a193" }}>Past and upcoming history</span>
          </div>
        </button>
      </div>

      {/* Upcoming sessions */}
      <div id="upcoming" style={{
        background: "#140d0b", border: "1.5px solid #3a261d", borderRadius: 20, marginBottom: 24
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 22px", borderBottom: "1px solid #281a15"
        }}>
          <h2 style={{ fontFamily: "var(--display)", fontSize: 22, textTransform: "uppercase", letterSpacing: ".02em", color: "#f3ece1", margin: 0 }}>
            Upcoming Sessions
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
          {loading && <div style={{ textAlign: "center", color: "#b0a193", padding: 32 }}>Loading…</div>}
          {!loading && data.upcoming.length === 0 && (
            <div style={{ textAlign: "center", padding: "48px 20px 56px" }}>
              <div style={{
                width: 100, height: 100, borderRadius: 24, margin: "0 auto 28px",
                display: "grid", placeItems: "center",
                background: "linear-gradient(150deg, #1d1411, #281a15)",
                border: "1.5px solid #3a261d", color: "#f0ab33"
              }}><Bell s={48} /></div>
              <h3 style={{ fontFamily: "var(--display)", fontSize: 28, textTransform: "uppercase", marginBottom: 12, color: "#f3ece1" }}>No upcoming sessions</h3>
              <p style={{ color: "#b0a193", fontSize: 15, lineHeight: 1.6, marginBottom: 28, maxWidth: 300, marginLeft: "auto", marginRight: "auto" }}>
                You don't have any sessions booked yet.<br />Ready to ignite your fitness journey?
              </p>
              <button className="btn btn-primary" onClick={() => go("book")} style={{ padding: "14px 32px", fontSize: 13 }}>Book Your First Session</button>
            </div>
          )}
          {!loading && data.upcoming.length > 0 && (
            <div className="ms-sessions-structured">
              {/* Featured next session */}
              <FeaturedSessionCard b={data.upcoming[0]} />

              {/* Remaining sessions - collapsed by default */}
              {data.upcoming.length > 1 && (
                <div style={{ marginTop: 8 }}>
                  <button
                    onClick={() => setShowAllSessions(!showAllSessions)}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      width: "100%", padding: "14px 20px",
                      background: "#1d1411", border: "1.5px solid #3a261d", borderRadius: 12,
                      fontFamily: "var(--mono)", fontSize: 12, fontWeight: 600, letterSpacing: ".06em",
                      textTransform: "uppercase", color: "#b0a193", cursor: "pointer"
                    }}
                  >
                    <span>{showAllSessions ? "Hide" : "View all"} sessions ({data.upcoming.length - 1} more)</span>
                    <span style={{ transform: showAllSessions ? "rotate(180deg)" : "none", transition: "transform .2s", display: "flex" }}>
                      <ChevronDown s={18} />
                    </span>
                  </button>

                  {showAllSessions && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
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
              )}
            </div>
          )}
        </div>
      </div>

      {/* Past sessions */}
      {data.past.length > 0 && (
        <div style={{
          background: "#140d0b", border: "1.5px solid #3a261d", borderRadius: 20,
          opacity: 0.85
        }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "18px 22px", borderBottom: "1px solid #281a15"
          }}>
            <h2 style={{ fontFamily: "var(--display)", fontSize: 20, textTransform: "uppercase", letterSpacing: ".02em", color: "#f3ece1", margin: 0 }}>
              Past &amp; Cancelled
            </h2>
            <span style={{
              fontFamily: "var(--mono)", fontSize: 12, fontWeight: 700,
              background: "rgba(176,161,147,.1)", color: "#78716c",
              padding: "5px 12px", borderRadius: 20
            }}>{data.past.length}</span>
          </div>
          <div style={{ padding: 20 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {data.past.map((b) => (
                <div key={b.id} style={{
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
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Cancel confirmation modal */}
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
            {/* Close button */}
            <button
              onClick={closeCancel}
              style={{
                position: "absolute", top: 16, right: 16,
                width: 32, height: 32, borderRadius: 8,
                background: "rgba(255,255,255,.05)", border: "none",
                color: "#78716c", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>

            <h2 style={{
              fontFamily: "var(--display)", fontSize: 24, textTransform: "uppercase",
              letterSpacing: ".02em", color: "#f3ece1", marginBottom: 20, paddingRight: 32
            }}>Cancel Session?</h2>

            {/* Session being cancelled */}
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
                    {CLASS_MAP[cancelBooking.classType?.toLowerCase()]?.label ?? CLASS_MAP[cancelBooking.classType]?.label ?? cancelBooking.classType}
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
              <button
                onClick={closeCancel}
                disabled={cancelling}
                style={{
                  flex: 1, padding: "14px 20px", borderRadius: 10,
                  fontFamily: "var(--mono)", fontSize: 12, fontWeight: 700,
                  letterSpacing: ".06em", textTransform: "uppercase",
                  background: "transparent", border: "1.5px solid #3a261d",
                  color: "#f3ece1", cursor: "pointer",
                  opacity: cancelling ? 0.5 : 1
                }}
              >Keep Session</button>
              <button
                onClick={confirmCancel}
                disabled={cancelling}
                style={{
                  flex: 1, padding: "14px 20px", borderRadius: 10,
                  fontFamily: "var(--mono)", fontSize: 12, fontWeight: 700,
                  letterSpacing: ".06em", textTransform: "uppercase",
                  background: "rgba(239,68,68,.15)", border: "1.5px solid rgba(239,68,68,.4)",
                  color: "#ef4444", cursor: "pointer",
                  opacity: cancelling ? 0.5 : 1
                }}
              >{cancelling ? "Cancelling…" : "Yes, Cancel"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule modal */}
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
            {/* Drag handle indicator */}
            <div style={{ width: 40, height: 4, borderRadius: 2, background: "#3a261d", margin: "0 auto 20px" }}></div>

            {/* Close button */}
            <button
              onClick={closeReschedule}
              style={{
                position: "absolute", top: 20, right: 16,
                width: 36, height: 36, borderRadius: 10,
                background: "rgba(255,255,255,.05)", border: "none",
                color: "#78716c", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>

            {rescheduleStep === 1 && (
              <>
                <h2 style={{
                  fontFamily: "var(--display)", fontSize: 22, textTransform: "uppercase",
                  letterSpacing: ".02em", color: "#f3ece1", marginBottom: 4, paddingRight: 40
                }}>Reschedule Session</h2>

                {/* Current session info */}
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
                        {CLASS_MAP[rescheduleBooking.classType?.toLowerCase()]?.label ?? CLASS_MAP[rescheduleBooking.classType]?.label ?? rescheduleBooking.classType}
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

                {/* Calendar grid */}
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
                      return (
                        <button key={i} onClick={() => hasAvail && setSelectedDate(isoD)} disabled={!hasAvail} style={{
                          width: "100%", aspectRatio: "1", display: "flex", alignItems: "center", justifyContent: "center",
                          fontFamily: "var(--body)", fontSize: 14, fontWeight: isSelected ? 700 : 500,
                          background: isSelected ? "#c9251c" : hasAvail ? "#1d1411" : "transparent",
                          color: isSelected ? "#fff" : outside || isPast ? "#3a261d" : hasAvail ? "#f3ece1" : "#78716c",
                          border: hasAvail && !isSelected ? "1px solid #3a261d" : "1px solid transparent",
                          borderRadius: 10, cursor: hasAvail ? "pointer" : "default", opacity: outside ? 0.3 : 1,
                        }}>{date.getUTCDate()}</button>
                      );
                    })}
                  </div>
                </div>

                {/* Time slots */}
                {selectedDate && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 13, color: "#b0a193", marginBottom: 12 }}>Available times for {fmtDate(selectedDate)}:</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                      {slotsForDate(selectedDate).map((s) => (
                        <button key={s.sessionId} onClick={() => setSelectedSlot(s)} style={{
                          padding: "12px 18px", borderRadius: 10, fontSize: 14, fontWeight: 600,
                          background: selectedSlot?.sessionId === s.sessionId ? "#c9251c" : "#1d1411",
                          color: selectedSlot?.sessionId === s.sessionId ? "#fff" : "#f3ece1",
                          border: selectedSlot?.sessionId === s.sessionId ? "none" : "1px solid #3a261d",
                          cursor: "pointer",
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
                      border: "none", color: selectedSlot ? "#fff" : "#78716c", cursor: selectedSlot ? "pointer" : "not-allowed"
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

                {/* From → To comparison */}
                <div style={{ display: "flex", alignItems: "center", gap: 16, justifyContent: "center", marginBottom: 24 }}>
                  <div style={{ textAlign: "center", flex: 1 }}>
                    <div style={{ fontSize: 10, color: "#78716c", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 8 }}>From</div>
                    <div style={{ fontFamily: "var(--display)", fontSize: 16, color: "#78716c", textDecoration: "line-through", marginBottom: 4 }}>
                      {fmtDate(rescheduleBooking.date)}
                    </div>
                    <div style={{ fontFamily: "var(--mono)", fontSize: 14, color: "#78716c" }}>{rescheduleBooking.time}</div>
                  </div>
                  <div style={{ color: "#f0ab33" }}>
                    <Arrow s={24} />
                  </div>
                  <div style={{ textAlign: "center", flex: 1 }}>
                    <div style={{ fontSize: 10, color: "#f0ab33", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 8 }}>To</div>
                    <div style={{ fontFamily: "var(--display)", fontSize: 16, color: "#f3ece1", marginBottom: 4 }}>
                      {fmtDate(selectedSlot.date)}
                    </div>
                    <div style={{ fontFamily: "var(--mono)", fontSize: 14, color: "#f0ab33" }}>{selectedSlot.time}</div>
                  </div>
                </div>

                <p style={{ color: "#b0a193", fontSize: 14, textAlign: "center", marginBottom: 24 }}>
                  {CLASS_MAP[rescheduleBooking.classType?.toLowerCase()]?.label ?? CLASS_MAP[rescheduleBooking.classType]?.label ?? rescheduleBooking.classType}
                </p>

                {rescheduleError && (
                  <div style={{
                    background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.3)",
                    borderRadius: 10, padding: "12px 14px", marginBottom: 20,
                    color: "#ef4444", fontSize: 13, fontFamily: "var(--mono)"
                  }}>{rescheduleError}</div>
                )}

                <div style={{ display: "flex", gap: 12 }}>
                  <button
                    onClick={() => setRescheduleStep(1)}
                    disabled={rescheduling}
                    style={{
                      flex: 1, padding: "14px 20px", borderRadius: 10,
                      fontFamily: "var(--mono)", fontSize: 12, fontWeight: 700,
                      letterSpacing: ".06em", textTransform: "uppercase",
                      background: "transparent", border: "1.5px solid #3a261d",
                      color: "#f3ece1", cursor: "pointer", opacity: rescheduling ? 0.5 : 1
                    }}
                  >Back</button>
                  <button
                    onClick={confirmReschedule}
                    disabled={rescheduling}
                    style={{
                      flex: 1, padding: "14px 20px", borderRadius: 10,
                      fontFamily: "var(--mono)", fontSize: 12, fontWeight: 700,
                      letterSpacing: ".06em", textTransform: "uppercase",
                      background: "linear-gradient(150deg, #e02d24, #c9251c)",
                      border: "none", color: "#fff", cursor: "pointer", opacity: rescheduling ? 0.5 : 1
                    }}
                  >{rescheduling ? "Rescheduling…" : "Confirm Change"}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Reschedule success modal */}
      {rescheduleSuccess && (
        <div
          onClick={closeReschedule}
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(0,0,0,.75)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 16
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "#1d1411", border: "1.5px solid #3a261d", borderRadius: 20,
              padding: "32px 24px", width: "100%", maxWidth: 400,
              boxShadow: "0 20px 60px rgba(0,0,0,.5)", textAlign: "center"
            }}
          >
            {/* Success icon */}
            <div style={{
              width: 72, height: 72, borderRadius: "50%", margin: "0 auto 20px",
              background: "linear-gradient(150deg, rgba(34,197,94,.2), rgba(34,197,94,.1))",
              border: "2px solid rgba(34,197,94,.4)",
              display: "grid", placeItems: "center", color: "#22c55e"
            }}>
              <Check s={36} />
            </div>

            <h2 style={{
              fontFamily: "var(--display)", fontSize: 24, textTransform: "uppercase",
              letterSpacing: ".02em", color: "#f3ece1", marginBottom: 12
            }}>Session Rescheduled</h2>

            <p style={{ color: "#b0a193", fontSize: 14, marginBottom: 24, lineHeight: 1.5 }}>
              Your session has been moved. A confirmation email is on its way.
            </p>

            {/* New session details */}
            <div style={{
              background: "#140d0b", border: "1px solid #281a15", borderRadius: 12,
              padding: 16, marginBottom: 24
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, justifyContent: "center" }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 11, display: "grid", placeItems: "center",
                  background: "rgba(34,197,94,.1)", color: "#22c55e"
                }}>
                  {rescheduleSuccess.newBooking.classType === "GROUP" || rescheduleSuccess.newBooking.classType === "group" ? <Bell s={22} /> : <User s={22} />}
                </div>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#f3ece1", marginBottom: 2 }}>
                    {CLASS_MAP[rescheduleSuccess.newBooking.classType?.toLowerCase()]?.label ?? CLASS_MAP[rescheduleSuccess.newBooking.classType]?.label ?? rescheduleSuccess.newBooking.classType}
                  </div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 13, color: "#22c55e" }}>
                    {fmtDate(rescheduleSuccess.newBooking.date)} · {rescheduleSuccess.newBooking.time}
                  </div>
                </div>
              </div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "#78716c", marginTop: 12 }}>
                Confirmation: {rescheduleSuccess.newBooking.ref}
              </div>
            </div>

            <button
              onClick={closeReschedule}
              style={{
                width: "100%", padding: "14px 20px", borderRadius: 10,
                fontFamily: "var(--mono)", fontSize: 12, fontWeight: 700,
                letterSpacing: ".06em", textTransform: "uppercase",
                background: "linear-gradient(150deg, #e02d24, #c9251c)",
                border: "none", color: "#fff", cursor: "pointer"
              }}
            >Done</button>
          </div>
        </div>
      )}

      {/* Cancel success toast */}
      {cancelSuccess && (
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          zIndex: 1100, display: "flex", alignItems: "center", gap: 12,
          background: "#1d1411", border: "1.5px solid rgba(34,197,94,.4)",
          borderRadius: 14, padding: "14px 20px", boxShadow: "0 8px 32px rgba(0,0,0,.4)",
          animation: "slideUp .3s ease"
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "rgba(34,197,94,.15)", display: "grid", placeItems: "center",
            color: "#22c55e"
          }}>
            <Check s={18} />
          </div>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#f3ece1" }}>Session cancelled</span>
        </div>
      )}
    </div></div>
  );
}

/* ---------- home ---------- */
function Home({ go, addLead }) {
  return (
    <>
      <header className="hero">
        <div className="hero-glow" /><div className="hero-glow2" />
        <div className="wrap hero-in">
          <img className="hero-logo reveal d1" src={LOGO_URL} alt="Ignition Fitness" />
          <div className="eyebrow reveal d2"><span className="dot" /> Kettlebell Training Specialists</div>
          <h1 className="hero-h reveal d3">Forge Your<br /><span className="lit">Strength</span><br /><span className="at">At Ignition Fitness</span></h1>
          <p className="hero-sub reveal d4">Small-group kettlebell training in Rancho Cucamonga. 15+ years of expert coaching, ten people max, and a whole lot of swing.</p>
          <div className="hero-cta reveal d4">
            <button className="btn btn-primary" onClick={() => go("book")}>Book Your First Class</button>
            <button className="btn btn-ghost" onClick={() => go("home")}>See Pricing</button>
          </div>
          <div className="stats reveal d5">
            {[["15+","Years Coaching"],["10","Max Class Size"],["RKC","Certified Since '08"],["100%","Commitment"]].map(([n,l]) => (
              <div className="stat" key={l}><div className="n">{n}</div><div className="l">{l}</div></div>
            ))}
          </div>
        </div>
      </header>

      <section className="section"><div className="wrap">
        <div className="kicker">One Tool · Infinite Possibilities</div>
        <h2 className="sh">One Bell.<br />Everything You Need.</h2>
        <div className="props">
          {["Strength + cardio in a single 60-minute session",
            "Burns more calories than traditional weight training",
            "Builds functional, real-world strength you actually use",
            "Low impact on joints, high impact on results",
            "Expert coaching every session, never guess again",
            "No machines, no confusion. Just you and the bell."].map((t) => (
            <div className="prop" key={t}><span className="ic"><Bell s={20} /></span><p>{t}</p></div>
          ))}
        </div>
      </div></section>

      <section className="section" style={{ paddingTop: 0 }}><div className="wrap">
        <div className="kicker">Why Kettlebells Win</div>
        <h2 className="sh">The Numbers Don't Lie</h2>
        <div className="three">
          {[["60","Minutes. That's It.","Strength, cardio, and mobility in one efficient session."],
            ["100%","Total Body","Glutes, core, shoulders, grip. Nothing gets left behind."],
            ["1","Tool. That's It.","No machines, no confusion. Just you and the bell."]].map(([n,t,p]) => (
            <div className="big" key={t}><div className="n">{n}</div><div className="t">{t}</div><p>{p}</p></div>
          ))}
        </div>
      </div></section>

      <section className="section" style={{ paddingTop: 0 }}><div className="wrap">
        <div className="kicker">Getting Started</div>
        <h2 className="sh">Three Steps To Ignition</h2>
        <p className="sh-sub">No experience needed. We meet you where you are.</p>
        <div className="steps">
          {[["01","Book A Class","Pick a time that works. Group classes are built for every level, and 1:1 training is there when you want it. Drop-ins always welcome."],
            ["02","Show Up","Small groups, max 10 people. Coach Mike guides every rep. You'll learn proper form from day one."],
            ["03","Get Strong","Feel the difference after one session. See it after four. Training that compounds. Every week you level up."]].map(([n,h,p]) => (
            <div className="step" key={n}><div className="num">{n}</div><h4>{h}</h4><p>{p}</p></div>
          ))}
        </div>
      </div></section>


      <section className="section" style={{ paddingTop: 0 }}><div className="wrap">
        <div className="kicker">Flexible Options</div>
        <h2 className="sh">Invest In Yourself</h2>
        <p className="sh-sub">Drop-ins, memberships, and 1:1 packs. Your first class is just $25.</p>
        <div className="price-grid">
          <div className="pcard">
            <div className="pname">Drop-In</div>
            <div className="pamt">$25<span> /class</span></div>
            <div className="pdesc">Try us out. No commitment.</div>
            <ul><li><Check /> Any class on the schedule</li><li><Check /> Expert coaching included</li><li><Check /> Perfect for first-timers</li></ul>
            <button className="btn btn-ghost" style={{ width: "100%" }} onClick={() => go("book")}>Book a Session</button>
          </div>
          <div className="pcard feat">
            <span className="pbadge">Best Value</span>
            <div className="pname">Biweekly</div>
            <div className="pamt">$75<span> /2 weeks</span></div>
            <div className="pdesc">Commit to your fitness. Save money.</div>
            <ul><li><Check /> Unlimited group classes</li><li><Check /> All class types included</li><li><Check /> Online booking</li></ul>
            <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => go("book")}>Get Started</button>
          </div>
          <div className="pcard">
            <div className="pname">1:1 Training</div>
            <div className="pamt">$80<span> /session</span></div>
            <div className="pdesc">Your goals. Your pace. Packs from $65/session.</div>
            <ul><li><Check /> One-on-one attention</li><li><Check /> 8 sessions, save $80</li><li><Check /> 12 sessions, save $180</li></ul>
            <button className="btn btn-ghost" style={{ width: "100%" }} onClick={() => go("book")}>Book a Session</button>
          </div>
        </div>
        <p style={{ color: "var(--ash)", fontSize: 14, fontFamily: "var(--mono)", textAlign: "center", marginTop: 24, letterSpacing: ".02em" }}>
          Payment is handled in person on the day of your session — no online payment required to book.
        </p>
      </div></section>

      <section className="section" style={{ paddingTop: 0 }}><div className="wrap">
        <div className="band"><div className="hero-glow2" />
          <h2>Ready To Ignite?</h2>
          <p>Your first class is waiting. Show up, work hard, see what happens.</p>
          <button className="btn btn-ghost" onClick={() => go("book")}>Get Started Today</button>
        </div>
      </div></section>
    </>
  );
}

/* ---------- booking ---------- */
const SLabel = ({ children }) => (<div style={{ fontFamily: "var(--mono)", fontSize: 12, letterSpacing: ".14em", color: "var(--ember2)", textTransform: "uppercase", marginBottom: 18, fontWeight: 600 }}>{children}</div>);

function Booking({ addBooking, go, user }) {
  const [step, setStep] = useState(1);
  const [classType, setClassType] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null); // legacy, kept for compatibility
  // Multi-session booking - always enabled
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [done, setDone] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [slots, setSlots] = useState([]);
  const [slotsLoaded, setSlotsLoaded] = useState(false);

  const [viewMonth, setViewMonth] = useState(() => {
    const now = studioNow();
    const d = new Date(now.isoDay + "T00:00:00.000Z");
    return { year: d.getUTCFullYear(), month: d.getUTCMonth() };
  });

  const cls = classType ? CLASS_MAP[classType] : null;

  const reloadSlots = React.useCallback(async () => {
    const firstDay = new Date(Date.UTC(viewMonth.year, viewMonth.month, 1));
    const lastDay = new Date(Date.UTC(viewMonth.year, viewMonth.month + 2, 0));
    const from = firstDay.toISOString().slice(0, 10);
    const to = lastDay.toISOString().slice(0, 10);
    try {
      const res = await fetch("/api/availability?from=" + from + "&to=" + to);
      setSlots(res.ok ? await res.json() : []);
    } catch { setSlots([]); }
    finally { setSlotsLoaded(true); }
  }, [viewMonth]);

  useEffect(() => { reloadSlots(); }, [reloadSlots]);
  useEffect(() => { if (user) setForm((f) => ({ ...f, name: user.name || "", email: user.email || "" })); }, [user]);

  const slotsForDate = (d) => slots.filter((s) => s.date === d && s.classType === classType);
  const dayHasSlots = (d) => slots.some((s) => s.date === d && s.classType === classType && s.spotsLeft > 0);

  const reset = () => {
    setDone(null); setStep(1); setClassType(null); setSelectedDate(null);
    setSelectedSlot(null); setSelectedSlots([]); setError(null);
    setForm({ name: user?.name || "", email: user?.email || "", phone: "" });
  };

  const confirm = async () => {
    // Always use selectedSlots array
    if (saving || selectedSlots.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      const created = await addBooking({
        items: selectedSlots.map(s => ({ sessionId: s.sessionId })),
        contact: user
          ? { phone: form.phone.trim() }
          : { name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim() },
      });

      // Handle array of bookings for multi-select
      const bookings = Array.isArray(created) ? created : [created];
      if (!bookings.length || !bookings[0]?.ref) {
        throw new Error("Booking was created but confirmation data is missing. Please check your bookings.");
      }

      // Store all bookings for confirmation display
      setDone(bookings);
      setStep(5);
      reloadSlots();
    } catch (e) {
      console.error("Booking error:", e);
      // Ensure error is always a primitive string for safe rendering
      let errorMsg = "Something went wrong. Please try again.";
      try {
        if (typeof e === "string") errorMsg = e;
        else if (e && typeof e.message === "string") errorMsg = e.message;
      } catch { /* keep default */ }
      setError(String(errorMsg));
      // Don't reload slots on error - it can cause render issues
    } finally {
      setSaving(false);
    }
  };

  // done is now an array of bookings
  const bookings = Array.isArray(done) ? done : (done ? [done] : []);
  if (bookings.length > 0 && bookings[0]?.ref) {
    const firstBooking = bookings[0];
    const totalPrice = bookings.reduce((sum, b) => sum + (CLASS_MAP[b.classType]?.price ?? 0), 0);
    const firstName = (firstBooking.name || "").split(" ")[0] || "there";
    const isMulti = bookings.length > 1;

    return (
      <div className="page"><div className="wrap"><div className="confirm">
        <div className="seal"><Check s={42} /></div>
        <h1>{isMulti ? `${bookings.length} Sessions Booked!` : "You're Booked!"}</h1>
        <p style={{ color: "var(--ash)", fontSize: 16, maxWidth: 400, margin: "0 auto" }}>
          See you at the bell, {firstName}. A confirmation email is on its way to {firstBooking.email || "your inbox"}.
        </p>

        {/* Show all booked sessions */}
        <div style={{ marginTop: 24 }}>
          {bookings.map((b, i) => {
            const sessionLabel = CLASS_MAP[b.classType]?.label || (b.classType === "pt" ? "Personal Training" : "Group Class");
            const canShowCalendar = b.sessionType && b.startTime && b.date;
            const calUrl = canShowCalendar ? googleCalendarUrl(b) : null;
            const price = CLASS_MAP[b.classType]?.price ?? 0;

            return (
              <div key={b.id} className="summary" style={{ marginBottom: isMulti ? 16 : 0, textAlign: "left" }}>
                {isMulti && (
                  <div style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: ".1em", color: "var(--ember2)", textTransform: "uppercase", marginBottom: 12, paddingBottom: 8, borderBottom: "1px solid var(--line)" }}>
                    Session {i + 1} · {b.ref}
                  </div>
                )}
                {!isMulti && <div className="ref" style={{ marginBottom: 16 }}>CONFIRMATION · {b.ref}</div>}
                <div className="srow">
                  <span className="k">Session</span>
                  <span className="v">{sessionLabel}</span>
                </div>
                <div className="srow">
                  <span className="k">Date & Time</span>
                  <span className="v">{b.date ? fmtDate(b.date) : "—"} · {b.time || "—"}</span>
                </div>
                <div className="srow">
                  <span className="k">Location</span>
                  <span className="v">{STUDIO.addressLine}</span>
                </div>
                {!isMulti && (
                  <div className="srow total">
                    <span className="k">Due at studio</span>
                    <span className="v">${price}</span>
                  </div>
                )}
                {canShowCalendar && (
                  <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
                    <a href={calUrl} target="_blank" rel="noopener noreferrer" style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ash)", textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}>
                      <CalendarIcon s={14} /> Google
                    </a>
                    <a href={`/api/bookings/${b.id}/ics`} style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ash)", textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg> .ics
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {isMulti && (
          <div className="summary" style={{ marginTop: 8, textAlign: "left" }}>
            <div className="srow total">
              <span className="k">Total due at studio</span>
              <span className="v">${totalPrice}</span>
            </div>
          </div>
        )}

        <p style={{ color: "var(--ash)", fontSize: 13, fontFamily: "var(--mono)", textAlign: "center", marginTop: 20 }}>
          Payment is handled in person. Cancel free up to 12 hours before.
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 24, flexWrap: "wrap" }}>
          <button className="btn btn-ghost" onClick={() => go("home")}>Back Home</button>
          {user && <button className="btn btn-ghost" onClick={() => go("mine")}>My Sessions</button>}
          <button className="btn btn-primary" onClick={reset}>Book Another</button>
        </div>
      </div></div></div>
    );
  }

  const contactOk = user ? true : form.name && /\S+@\S+\.\S+/.test(form.email) && form.phone.length >= 7;
  const canNext = (step === 1 && classType) || (step === 2 && selectedSlots.length > 0) || (step === 3 && contactOk);

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

  const todayIso = studioNow().isoDay;
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const prevMonth = () => { setViewMonth(v => { const d = new Date(Date.UTC(v.year, v.month - 1, 1)); return { year: d.getUTCFullYear(), month: d.getUTCMonth() }; }); setSelectedDate(null); };
  const nextMonth = () => { setViewMonth(v => { const d = new Date(Date.UTC(v.year, v.month + 1, 1)); return { year: d.getUTCFullYear(), month: d.getUTCMonth() }; }); setSelectedDate(null); };

  return (
    <div className="page"><div className="wrap">
      <div className="page-head"><h1>Book Your Spot</h1><p>Pick your session type, choose a date, and we'll see you at the studio.</p></div>
      <div className="steps-bar">
        {[1, 2, 3, 4].map((n, i) => (<React.Fragment key={n}><div className={"sbubble" + (step === n ? " on" : step > n ? " done" : "")}>{step > n ? <Check /> : n}</div>{i < 3 && <div className={"sline" + (step > n ? " on" : "")} />}</React.Fragment>))}
      </div>
      <div className="card">
        {step === 1 && (<>
          <SLabel>Choose your training</SLabel>
          <div className="opt-grid">
            {CLASSES.map((c) => (<button key={c.id} className={"opt" + (classType === c.id ? " sel" : "")} onClick={() => setClassType(c.id)}>
              <span className="oicon">{c.id === "pt" ? <User s={22} /> : <Bell s={22} />}</span>
              <div className="otext">
                <span className="otitle">{c.label}</span>
                <span className="otag">{c.tag}</span>
                <span className="odesc">{c.desc}</span>
              </div>
              {!user && <span className="oprice">${c.price}<small>{c.id === "pt" ? "per session" : "drop-in"}</small></span>}
            </button>))}
          </div>
        </>)}

        {step === 2 && (<>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20, marginBottom: 24 }}>
            <button onClick={prevMonth} style={{ width: 36, height: 36, borderRadius: 8, border: "1px solid var(--line)", background: "transparent", color: "var(--ash)", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>&larr;</button>
            <div style={{ fontFamily: "var(--body)", fontSize: 18, fontWeight: 600, color: "var(--bone)", minWidth: 160, textAlign: "center" }}>{monthNames[viewMonth.month]} {viewMonth.year}</div>
            <button onClick={nextMonth} style={{ width: 36, height: 36, borderRadius: 8, border: "1px solid var(--line)", background: "transparent", color: "var(--ash)", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>&rarr;</button>
          </div>
          <div style={{ padding: 0, maxWidth: 420, margin: "0 auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, marginBottom: 8 }}>
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                <div key={d} style={{ textAlign: "center", fontFamily: "var(--mono)", fontSize: 10, letterSpacing: ".05em", color: "var(--ash)", textTransform: "uppercase", padding: "4px 0" }}>{d}</div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
              {calendarDays.map(({ date, outside }, i) => {
                const iso = date.toISOString().slice(0, 10);
                const isPast = iso < todayIso;
                const hasAvail = !isPast && !outside && dayHasSlots(iso);
                const isSelected = selectedDate === iso;
                const isToday = iso === todayIso;
                // Count how many slots are selected for this date
                const selectedCountForDate = selectedSlots.filter(s => s.date === iso).length;

                const baseStyle = {
                  width: "100%",
                  height: 44,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "var(--body)",
                  fontWeight: 500,
                  fontSize: 14,
                  borderRadius: 6,
                  cursor: hasAvail ? "pointer" : "not-allowed",
                  padding: 0,
                  transition: ".15s",
                  border: "2px solid",
                  position: "relative",
                };

                let style = { ...baseStyle };

                if (outside) {
                  style.opacity = 0;
                  style.pointerEvents = "none";
                  style.background = "transparent";
                  style.borderColor = "transparent";
                  style.color = "transparent";
                } else if (isSelected) {
                  style.background = "var(--ember)";
                  style.borderColor = "var(--ember)";
                  style.color = "#fff";
                } else if (hasAvail) {
                  style.background = "rgba(224,45,36,.1)";
                  style.borderColor = "var(--ember)";
                  style.color = "var(--bone)";
                } else if (isPast) {
                  style.background = "var(--f900)";
                  style.borderColor = "var(--line)";
                  style.color = "var(--ash)";
                  style.opacity = 0.4;
                } else {
                  style.background = "var(--f900)";
                  style.borderColor = "var(--line)";
                  style.color = "var(--ash)";
                  style.opacity = 0.5;
                }

                if (isToday && !isSelected) {
                  style.boxShadow = "inset 0 0 0 2px var(--ember)";
                }

                return (
                  <button
                    key={i}
                    style={style}
                    disabled={outside || isPast || !hasAvail}
                    onClick={() => { setSelectedDate(iso); setSelectedSlot(null); }}
                  >
                    {date.getUTCDate()}
                    {/* Badge showing count of selected slots for this date */}
                    {selectedCountForDate > 0 && (
                      <span style={{
                        position: "absolute", top: 2, right: 2,
                        width: 16, height: 16, borderRadius: "50%",
                        background: "var(--ember)", color: "#fff",
                        fontSize: 10, fontWeight: 700, fontFamily: "var(--mono)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        {selectedCountForDate}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          {selectedDate && (<div style={{ marginTop: 24 }}>
            <SLabel>Available times on {fmtDate(selectedDate)}</SLabel>
            <div className="slot-grid">
              {slotsForDate(selectedDate).map((s) => {
                const isSelected = selectedSlots.some(sl => sl.sessionId === s.sessionId);
                const isFull = s.spotsLeft === 0;
                const spotClass = isFull ? "spots-none" : s.spotsLeft <= 3 ? "spots-low" : "spots-ok";

                const handleSlotClick = () => {
                  // Toggle slot in/out of selection
                  setSelectedSlots(prev => {
                    const exists = prev.some(sl => sl.sessionId === s.sessionId);
                    if (exists) {
                      return prev.filter(sl => sl.sessionId !== s.sessionId);
                    } else {
                      return [...prev, s];
                    }
                  });
                };

                return (<button key={s.sessionId} disabled={isFull} className={"slot" + (isSelected ? " picked" : "")} onClick={handleSlotClick}>
                  <div className="stime">{s.time}</div><div className="stype">{cls?.label}</div>
                  <div className={"sspots " + spotClass}>{isSelected ? "Selected ✓" : isFull ? "Full" : classType === "pt" ? "Available" : s.booked + " of " + s.capacity + " booked"}</div>
                </button>);
              })}
            </div>
            {slotsForDate(selectedDate).length === 0 && <div className="empty-day">No available times on this date.</div>}
          </div>)}
          {!slotsLoaded && <div className="empty-day" style={{ marginTop: 20 }}>Loading availability...</div>}
          {slotsLoaded && !selectedDate && <div className="empty-day" style={{ marginTop: 20 }}>Tap a highlighted date to see available times.</div>}

          {/* Selected sessions summary tray */}
          {selectedSlots.length > 0 && (
            <div style={{
              position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
              background: "linear-gradient(to top, rgba(12,9,8,.98) 80%, transparent)",
              padding: "24px 16px 20px",
            }}>
              <div style={{ maxWidth: 520, margin: "0 auto" }}>
                <div style={{
                  background: "#1d1411", border: "1.5px solid #3a261d", borderRadius: 16,
                  padding: 16, boxShadow: "0 -4px 20px rgba(0,0,0,.3)"
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 11, fontWeight: 600, letterSpacing: ".1em", color: "var(--ember2)", textTransform: "uppercase" }}>
                      {selectedSlots.length} session{selectedSlots.length > 1 ? "s" : ""} selected
                    </span>
                    <button
                      onClick={() => setSelectedSlots([])}
                      style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ash)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
                    >
                      Clear all
                    </button>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", maxHeight: 100, overflowY: "auto" }}>
                    {selectedSlots
                      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
                      .map((s) => (
                        <div
                          key={s.sessionId}
                          style={{
                            display: "flex", alignItems: "center", gap: 8,
                            background: "rgba(224,45,36,.1)", border: "1px solid rgba(224,45,36,.3)",
                            borderRadius: 8, padding: "6px 10px"
                          }}
                        >
                          <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--bone)" }}>
                            {new Date(s.date + "T00:00:00.000Z").toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {s.time}
                          </span>
                          <button
                            onClick={() => setSelectedSlots(prev => prev.filter(sl => sl.sessionId !== s.sessionId))}
                            style={{ width: 18, height: 18, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", color: "var(--ash)", cursor: "pointer", padding: 0 }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>)}

        {step === 3 && (<>
          <SLabel>Your details</SLabel>
          {user ? (<>
            <div className="summary" style={{ marginBottom: 18 }}><div className="srow"><span className="k">Booking as</span><span className="v">{user.name}</span></div><div className="srow"><span className="k">Email</span><span className="v">{user.email}</span></div></div>
            <div className="field"><label>Phone (optional)</label><input type="tel" inputMode="tel" autoComplete="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(909) 555-0123" /></div>
          </>) : (<>
            <div className="field"><label>Full name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Jane Doe" /></div>
            <div className="field"><label>Email</label><input type="email" inputMode="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="jane@email.com" /></div>
            <div className="field"><label>Phone</label><input type="tel" inputMode="tel" autoComplete="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(909) 555-0123" /></div>
            <p style={{ color: "var(--ash)", fontSize: 13, fontFamily: "var(--mono)", textAlign: "center" }}>Booking as a guest. <a href="/signup" style={{ color: "var(--ember2)" }}>Create an account</a> to track your sessions.</p>
          </>)}
        </>)}

        {step === 4 && (<>
          <SLabel>Review & confirm</SLabel>
          {(() => {
            if (selectedSlots.length === 0) {
              return <div className="empty-day">Please go back and select a time slot.</div>;
            }
            const totalPrice = selectedSlots.reduce((sum, s) => sum + (cls?.price ?? 0), 0);
            const isMulti = selectedSlots.length > 1;
            return (
              <>
                {isMulti && (
                  <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--ember2)", marginBottom: 16, textAlign: "center" }}>
                    Booking {selectedSlots.length} sessions
                  </div>
                )}
                {selectedSlots
                  .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
                  .map((slot, i) => (
                    <div key={slot.sessionId} className="summary" style={{ marginBottom: isMulti ? 12 : 0 }}>
                      {isMulti && (
                        <div style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: ".08em", color: "var(--ash)", marginBottom: 8, textTransform: "uppercase" }}>
                          Session {i + 1}
                        </div>
                      )}
                      <div className="srow"><span className="k">Session</span><span className="v">{cls?.label || "Session"}</span></div>
                      <div className="srow"><span className="k">Date</span><span className="v">{fmtDate(slot.date)}</span></div>
                      <div className="srow"><span className="k">Time</span><span className="v">{slot.time}</span></div>
                      {!isMulti && (
                        <>
                          <div className="srow"><span className="k">Name</span><span className="v">{user ? user.name : form.name}</span></div>
                          <div className="srow"><span className="k">Contact</span><span className="v">{user ? user.email : form.email}</span></div>
                          <div className="srow total"><span className="k">Due at studio</span><span className="v">${cls?.price ?? 0}</span></div>
                        </>
                      )}
                    </div>
                  ))}
                {isMulti && (
                  <div className="summary" style={{ marginTop: 4 }}>
                    <div className="srow"><span className="k">Name</span><span className="v">{user ? user.name : form.name}</span></div>
                    <div className="srow"><span className="k">Contact</span><span className="v">{user ? user.email : form.email}</span></div>
                    <div className="srow total"><span className="k">Total due at studio</span><span className="v">${totalPrice}</span></div>
                  </div>
                )}
                <p style={{ color: "var(--ash)", fontSize: 13, fontFamily: "var(--mono)", textAlign: "center", marginTop: 12 }}>Payment is handled in person. Cancel free up to 12 hours before.</p>
              </>
            );
          })()}
          {error && <p style={{ color: "var(--flame)", fontSize: 13, fontFamily: "var(--mono)", textAlign: "center", marginTop: 12 }}>{error}</p>}
        </>)}
      </div>
      <div className="nav-btns" style={{ paddingBottom: selectedSlots.length > 0 && step === 2 ? 140 : 0 }}>
        <button className="btn btn-ghost" onClick={() => step === 1 ? go("home") : setStep(step - 1)}>{step === 1 ? "Cancel" : "Back"}</button>
        {step < 4 ? <button className="btn btn-primary" disabled={!canNext} onClick={() => setStep(step + 1)}>Continue <Arrow /></button>
          : <button className="btn btn-primary" disabled={saving} onClick={confirm}>{saving ? "Booking..." : <>Confirm {selectedSlots.length > 1 ? `${selectedSlots.length} Bookings` : "Booking"} <Check /></>}</button>}
      </div>
    </div></div>
  );
}
// Parsed and read in UTC so a "YYYY-MM-DD" always renders as that same day,
// regardless of the viewer's own timezone.
function fmtDate(d) { const x = new Date(d + "T00:00:00.000Z"); return `${DOW[x.getUTCDay()]}, ${MON[x.getUTCMonth()]} ${x.getUTCDate()}`; }

/* ---------- lead magnet ---------- */
/* ---------- footer ---------- */
function Footer({ go }) {
  return (
    <footer className="foot"><div className="wrap">
      <div className="foot-grid">
        <div>
          <button className="logo" onClick={() => go("home")} style={{ marginBottom: 18 }}>
            <Logo h={62} />
          </button>
          <p style={{ maxWidth: "34ch" }}>Forging strength, one swing at a time. Small-group kettlebell training in Rancho Cucamonga.</p>
        </div>
        <div><h5>Navigate</h5>
          <a onClick={() => go("home")} style={{ cursor: "pointer" }}>Home</a>
          <a onClick={() => go("home")} style={{ cursor: "pointer" }}>Our Story</a>
          <a onClick={() => go("home")} style={{ cursor: "pointer" }}>Pricing</a>
          <a onClick={() => go("book")} style={{ cursor: "pointer" }}>Book a Class</a>
        </div>
        <div><h5>Contact</h5>
          <a href="mailto:mike@ignitionfitness.com">mike@ignitionfitness.com</a>
          <a href="tel:9099214463">(909) 921-4463</a>
          <p>9125 Archibald Ave, Ste D<br />Rancho Cucamonga, CA 91730</p>
        </div>
      </div>
      <div className="foot-bottom"><span>© 2026 Ignition Fitness</span><span>FORGE · SWING · REPEAT</span></div>
    </div></footer>
  );
}
