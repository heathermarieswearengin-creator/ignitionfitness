"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Theme } from "@/app/theme";
import { studioNow, STUDIO } from "@/lib/config";
import { googleCalendarUrl } from "@/lib/ics";

const CLASS_MAP = {
  group: { label: "Group Class" },
  pt: { label: "1:1 Personal Training" },
  GROUP: { label: "Group Class" },
  PT: { label: "1:1 Personal Training" },
};

const monthNames = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];

const fmtDate = (iso) => {
  const d = new Date(`${iso}T00:00:00Z`);
  const dow = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getUTCDay()];
  const mon = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][d.getUTCMonth()];
  return `${dow}, ${mon} ${d.getUTCDate()}`;
};

const Bell = ({ s = 22 }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M9 6a3 3 0 1 1 6 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M12 8c-3.5 0-6 2.8-6 6.5C6 18 8.7 21 12 21s6-3 6-6.5C18 10.8 15.5 8 12 8z" stroke="currentColor" strokeWidth="2"/></svg>);
const User = ({ s = 22 }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/><path d="M4 21c0-4 3.5-6 8-6s8 2 8 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>);
const Arrow = ({ s = 16 }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>);
const Check = ({ s = 40 }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M5 12l4.5 4.5L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>);
const CalendarIcon = ({ s = 16 }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="17" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M3 9h18M8 3v3M16 3v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>);

export default function ManageBookingPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [booking, setBooking] = useState(null);
  const [otherBookings, setOtherBookings] = useState([]);

  // Cancel state
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  // Reschedule state
  const [showReschedule, setShowReschedule] = useState(false);
  const [rescheduleStep, setRescheduleStep] = useState(1);
  const [slots, setSlots] = useState([]);
  const [slotsLoaded, setSlotsLoaded] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [rescheduling, setRescheduling] = useState(false);
  const [rescheduleError, setRescheduleError] = useState(null);
  const [rescheduleSuccess, setRescheduleSuccess] = useState(null);

  // Calendar month navigation
  const now = studioNow();
  const todayIso = now.isoDay;
  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date(`${todayIso}T00:00:00Z`);
    return { year: d.getUTCFullYear(), month: d.getUTCMonth() };
  });

  // Fetch booking details
  useEffect(() => {
    if (!token) return;

    async function fetchBooking() {
      try {
        const res = await fetch(`/api/manage-booking/${token}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Could not load booking");
          return;
        }

        setBooking(data);
        setOtherBookings(data.otherBookings || []);
      } catch (err) {
        setError("Failed to load booking. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchBooking();
  }, [token]);

  // Load availability slots for reschedule
  const loadSlots = useCallback(async () => {
    if (!booking) return;

    const { year, month } = viewMonth;
    const from = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    const to = `${year}-${String(month + 1).padStart(2, "0")}-${lastDay}`;

    try {
      const res = await fetch(`/api/availability?from=${from}&to=${to}`);
      const data = await res.json();

      // Filter to same session type
      const classType = booking.classType?.toLowerCase() || booking.sessionType?.toLowerCase();
      const filtered = data.filter(s => s.classType?.toLowerCase() === classType);
      setSlots(filtered);
      setSlotsLoaded(true);
    } catch (err) {
      console.error("Failed to load slots:", err);
    }
  }, [booking, viewMonth]);

  useEffect(() => {
    if (showReschedule && booking) {
      loadSlots();
    }
  }, [showReschedule, loadSlots, booking]);

  // Calendar days for the month
  const calendarDays = useMemo(() => {
    const { year, month } = viewMonth;
    const firstOfMonth = new Date(Date.UTC(year, month, 1));
    const startDow = firstOfMonth.getUTCDay();
    const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

    const days = [];
    // Previous month days
    const prevMonth = new Date(Date.UTC(year, month, 0));
    const prevDays = prevMonth.getUTCDate();
    for (let i = startDow - 1; i >= 0; i--) {
      days.push({ date: new Date(Date.UTC(year, month - 1, prevDays - i)), outside: true });
    }
    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({ date: new Date(Date.UTC(year, month, d)), outside: false });
    }
    // Next month days to fill row
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      days.push({ date: new Date(Date.UTC(year, month + 1, d)), outside: true });
    }
    return days;
  }, [viewMonth]);

  const dayHasSlots = (isoDay) => slots.some(s => s.date === isoDay && s.spotsLeft > 0);
  const slotsForDate = (isoDay) => slots.filter(s => s.date === isoDay && s.spotsLeft > 0);
  const getOtherBookingsForDate = (isoDay) => otherBookings.filter(b => b.date === isoDay && b.status !== "cancelled");
  const hasOtherBookingOnDate = (isoDay) => getOtherBookingsForDate(isoDay).length > 0;

  const prevMonth = () => setViewMonth(v => {
    const d = new Date(Date.UTC(v.year, v.month - 1, 1));
    return { year: d.getUTCFullYear(), month: d.getUTCMonth() };
  });

  const nextMonth = () => setViewMonth(v => {
    const d = new Date(Date.UTC(v.year, v.month + 1, 1));
    return { year: d.getUTCFullYear(), month: d.getUTCMonth() };
  });

  // Cancel booking
  const handleCancel = async () => {
    setCancelling(true);
    try {
      const res = await fetch(`/api/manage-booking/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel", reason: cancelReason || undefined }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Could not cancel booking");
        return;
      }

      setCancelSuccess(true);
      setShowCancelConfirm(false);
    } catch (err) {
      setError("Failed to cancel. Please try again.");
    } finally {
      setCancelling(false);
    }
  };

  const CANCEL_REASONS = ["Sick", "Travel", "Schedule conflict", "Other"];

  // Reschedule booking
  const handleReschedule = async () => {
    if (!selectedSlot) return;

    setRescheduling(true);
    setRescheduleError(null);

    try {
      const res = await fetch(`/api/manage-booking/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reschedule", newSessionId: selectedSlot.sessionId }),
      });
      const data = await res.json();

      if (!res.ok) {
        setRescheduleError(data.error || "Could not reschedule");
        return;
      }

      setRescheduleSuccess(data.newBooking);
      setShowReschedule(false);
    } catch (err) {
      setRescheduleError("Failed to reschedule. Please try again.");
    } finally {
      setRescheduling(false);
    }
  };

  const closeReschedule = () => {
    setShowReschedule(false);
    setRescheduleStep(1);
    setSelectedDate(null);
    setSelectedSlot(null);
    setRescheduleError(null);
  };

  // Loading state
  if (loading) {
    return (
      <div className="ign">
        <Theme />
        <div className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
          <div style={{ textAlign: "center", color: "var(--ash)" }}>
            <div style={{ fontSize: 18, marginBottom: 8 }}>Loading booking...</div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 12 }}>Please wait</div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !booking) {
    return (
      <div className="ign">
        <Theme />
        <div className="page">
          <div className="wrap" style={{ maxWidth: 480, textAlign: "center", paddingTop: 60 }}>
            <div style={{
              width: 80, height: 80, borderRadius: 20, margin: "0 auto 24px",
              background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.3)",
              display: "grid", placeItems: "center"
            }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 8v4M12 16h.01"/>
              </svg>
            </div>
            <h1 style={{ fontFamily: "var(--display)", fontSize: 32, textTransform: "uppercase", marginBottom: 16 }}>
              {error.includes("expired") ? "Link Expired" : "Booking Not Found"}
            </h1>
            <p style={{ color: "var(--ash)", fontSize: 15, marginBottom: 28, lineHeight: 1.6 }}>
              {error}
            </p>
            <button
              onClick={() => router.push("/")}
              className="btn btn-primary"
              style={{ padding: "14px 32px" }}
            >
              Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Cancellation success
  if (cancelSuccess) {
    return (
      <div className="ign">
        <Theme />
        <div className="page">
          <div className="wrap" style={{ maxWidth: 480, textAlign: "center", paddingTop: 60 }}>
            <div style={{
              width: 90, height: 90, borderRadius: "50%", margin: "0 auto 28px",
              background: "linear-gradient(150deg, #e02d24, #c9251c)",
              display: "grid", placeItems: "center",
              boxShadow: "0 0 40px rgba(224,45,36,.5)"
            }}>
              <Check s={44} />
            </div>
            <h1 style={{ fontFamily: "var(--display)", fontSize: 36, textTransform: "uppercase", marginBottom: 12 }}>
              Booking Cancelled
            </h1>
            <p style={{ color: "var(--ash)", fontSize: 15, marginBottom: 8 }}>
              Your session has been cancelled.
            </p>
            <p style={{ fontFamily: "var(--mono)", fontSize: 13, color: "var(--ember2)", marginBottom: 32 }}>
              {CLASS_MAP[booking.classType]?.label || booking.classType} · {fmtDate(booking.date)} · {booking.time}
            </p>
            <button
              onClick={() => router.push("/")}
              className="btn btn-ghost"
              style={{ padding: "14px 32px" }}
            >
              Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Reschedule success
  if (rescheduleSuccess) {
    return (
      <div className="ign">
        <Theme />
        <div className="page">
          <div className="wrap" style={{ maxWidth: 520, textAlign: "center", paddingTop: 60 }}>
            <div style={{
              width: 90, height: 90, borderRadius: "50%", margin: "0 auto 28px",
              background: "linear-gradient(150deg, #e02d24, #c9251c)",
              display: "grid", placeItems: "center",
              boxShadow: "0 0 40px rgba(224,45,36,.5)"
            }}>
              <Check s={44} />
            </div>
            <h1 style={{ fontFamily: "var(--display)", fontSize: 36, textTransform: "uppercase", marginBottom: 12 }}>
              Session Rescheduled
            </h1>
            <p style={{ color: "var(--ash)", fontSize: 15, marginBottom: 24 }}>
              Your booking has been moved to the new time.
            </p>

            {/* New booking details */}
            <div style={{
              background: "var(--f900)", border: "1px solid var(--line)", borderRadius: 16,
              padding: 24, marginBottom: 28
            }}>
              <div style={{ fontSize: 10, color: "var(--ember2)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 12 }}>
                New Session
              </div>
              <div style={{ fontFamily: "var(--display)", fontSize: 22, marginBottom: 6 }}>
                {CLASS_MAP[rescheduleSuccess.classType]?.label || rescheduleSuccess.classType}
              </div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 14, color: "var(--ash)", marginBottom: 16 }}>
                {fmtDate(rescheduleSuccess.date)} · {rescheduleSuccess.time}
              </div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--ember2)" }}>
                Confirmation: {rescheduleSuccess.ref}
              </div>
            </div>

            <p style={{ color: "var(--ash)", fontSize: 13, marginBottom: 24 }}>
              A confirmation email has been sent with your updated booking details.
            </p>

            <button
              onClick={() => router.push("/")}
              className="btn btn-ghost"
              style={{ padding: "14px 32px" }}
            >
              Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main booking view
  return (
    <div className="ign">
      <Theme />
      <div className="page">
        <div className="wrap" style={{ maxWidth: 520 }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <h1 style={{ fontFamily: "var(--display)", fontSize: "clamp(32px, 6vw, 44px)", textTransform: "uppercase", marginBottom: 8 }}>
              Manage Booking
            </h1>
            <p style={{ fontFamily: "var(--mono)", fontSize: 13, color: "var(--ember2)" }}>
              Confirmation: {booking.ref}
            </p>
          </div>

          {/* Booking details card */}
          <div style={{
            background: "var(--f900)", border: "1.5px solid var(--line)", borderRadius: 18,
            padding: 28, marginBottom: 24
          }}>
            {/* Session type with icon */}
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
              <div style={{
                width: 56, height: 56, borderRadius: 14, display: "grid", placeItems: "center",
                background: "linear-gradient(150deg, rgba(224,45,36,.18), rgba(150,22,16,.06))",
                color: "var(--ember2)"
              }}>
                {booking.classType === "group" || booking.sessionType === "GROUP" ? <Bell s={26} /> : <User s={26} />}
              </div>
              <div>
                <div style={{ fontFamily: "var(--display)", fontSize: 22, textTransform: "uppercase", marginBottom: 4 }}>
                  {CLASS_MAP[booking.classType]?.label || CLASS_MAP[booking.sessionType]?.label || booking.classType}
                </div>
                <div style={{
                  display: "inline-block", fontFamily: "var(--mono)", fontSize: 10, letterSpacing: ".08em",
                  textTransform: "uppercase", background: "rgba(111,138,153,.18)", color: "var(--steel)",
                  padding: "4px 10px", borderRadius: 20
                }}>
                  {booking.status}
                </div>
              </div>
            </div>

            {/* Date & Time */}
            <div style={{
              background: "var(--f800)", border: "1px solid var(--line)", borderRadius: 12,
              padding: 18, marginBottom: 20
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <CalendarIcon s={20} />
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 2 }}>
                    {fmtDate(booking.date)}
                  </div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 14, color: "var(--ember2)" }}>
                    {booking.time}
                  </div>
                </div>
              </div>
            </div>

            {/* Booking info */}
            <div style={{ fontSize: 14, color: "var(--ash)" }}>
              <div style={{ marginBottom: 8 }}>
                <span style={{ color: "var(--bone)" }}>Name:</span> {booking.name}
              </div>
              <div>
                <span style={{ color: "var(--bone)" }}>Email:</span> {booking.email}
              </div>
            </div>
          </div>

          {/* Add to calendar */}
          {booking.status !== "cancelled" && (
            <div style={{
              background: "var(--f900)", border: "1.5px solid var(--line)", borderRadius: 14,
              padding: 18, marginBottom: 24, textAlign: "center"
            }}>
              <div style={{ fontSize: 11, color: "var(--ash)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 12 }}>
                Add to Calendar
              </div>
              <div style={{ display: "flex", justifyContent: "center", gap: 20 }}>
                <a
                  href={googleCalendarUrl({
                    date: booking.date,
                    startTime: booking.startTime,
                    durationMin: booking.durationMin || 60,
                    classType: booking.classType,
                    ref: booking.ref,
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    fontFamily: "var(--mono)", fontSize: 12, color: "var(--ember2)",
                    textDecoration: "none"
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm5.2 17.2L12 13.4l-5.2 3.8 2-6L4 7.5h6.2L12 2l1.8 5.5H20l-4.8 3.7 2 6z"/>
                  </svg>
                  Google
                </a>
              </div>
            </div>
          )}

          {/* Action buttons */}
          {booking.status !== "cancelled" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <button
                onClick={() => setShowReschedule(true)}
                className="btn btn-ghost"
                style={{ padding: "16px 20px" }}
              >
                Reschedule
              </button>
              <button
                onClick={() => setShowCancelConfirm(true)}
                style={{
                  padding: "16px 20px", borderRadius: 9,
                  fontFamily: "var(--mono)", fontSize: 12.5, fontWeight: 700,
                  letterSpacing: ".06em", textTransform: "uppercase",
                  background: "rgba(150,22,16,.2)", border: "1px solid rgba(224,45,36,.3)",
                  color: "var(--flame)", cursor: "pointer"
                }}
              >
                Cancel
              </button>
            </div>
          )}

          {/* Back link */}
          <div style={{ textAlign: "center", marginTop: 28 }}>
            <button
              onClick={() => router.push("/")}
              style={{
                background: "none", border: "none", color: "var(--ash)",
                fontFamily: "var(--mono)", fontSize: 12, cursor: "pointer"
              }}
            >
              ← Return to Home
            </button>
          </div>
        </div>
      </div>

      {/* Cancel confirmation modal */}
      {showCancelConfirm && (
        <div
          onClick={() => { setShowCancelConfirm(false); setCancelReason(""); }}
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
              background: "var(--f900)", border: "1.5px solid var(--line)",
              borderRadius: 18, padding: 28, width: "100%", maxWidth: 420,
              textAlign: "center"
            }}
          >
            <h2 style={{
              fontFamily: "var(--display)", fontSize: 26, textTransform: "uppercase",
              marginBottom: 16
            }}>
              Cancel Session?
            </h2>
            <p style={{ color: "var(--ash)", fontSize: 14, marginBottom: 20, lineHeight: 1.5 }}>
              Are you sure you want to cancel your booking?
            </p>
            <div style={{
              background: "var(--f800)", border: "1px solid var(--line)", borderRadius: 12,
              padding: 16, marginBottom: 20
            }}>
              <div style={{ fontFamily: "var(--display)", fontSize: 18, marginBottom: 4 }}>
                {CLASS_MAP[booking.classType]?.label || booking.classType}
              </div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 13, color: "var(--ash)" }}>
                {fmtDate(booking.date)} · {booking.time}
              </div>
            </div>

            {/* Reason field (only for 1:1 PT) */}
            {(booking.classType === "pt" || booking.sessionType === "PT") && (
              <div style={{ marginBottom: 24, textAlign: "left" }}>
                <div style={{ fontSize: 12, color: "var(--ash)", marginBottom: 10 }}>
                  Let Mike know why (optional)
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                  {CANCEL_REASONS.map(reason => (
                    <button
                      key={reason}
                      onClick={() => setCancelReason(cancelReason === reason ? "" : reason)}
                      style={{
                        padding: "8px 14px",
                        borderRadius: 20,
                        fontSize: 13,
                        fontWeight: 500,
                        background: cancelReason === reason ? "rgba(240,171,51,.2)" : "var(--f800)",
                        border: cancelReason === reason ? "1px solid rgba(240,171,51,.5)" : "1px solid var(--line)",
                        color: cancelReason === reason ? "var(--gold)" : "var(--bone)",
                        cursor: "pointer",
                      }}
                    >
                      {reason}
                    </button>
                  ))}
                </div>
                <textarea
                  value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)}
                  placeholder="Add details (optional)..."
                  rows={2}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    background: "var(--f800)",
                    border: "1px solid var(--line)",
                    borderRadius: 10,
                    color: "var(--bone)",
                    fontSize: 14,
                    fontFamily: "inherit",
                    resize: "none",
                  }}
                />
              </div>
            )}

            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => { setShowCancelConfirm(false); setCancelReason(""); }}
                className="btn btn-ghost"
                style={{ flex: 1, padding: "14px 20px" }}
                disabled={cancelling}
              >
                Keep Booking
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                style={{
                  flex: 1, padding: "14px 20px", borderRadius: 9,
                  fontFamily: "var(--mono)", fontSize: 12.5, fontWeight: 700,
                  letterSpacing: ".06em", textTransform: "uppercase",
                  background: cancelling ? "#281a15" : "linear-gradient(150deg, #e02d24, #c9251c)",
                  border: "none", color: cancelling ? "#78716c" : "#fff",
                  cursor: cancelling ? "not-allowed" : "pointer"
                }}
              >
                {cancelling ? "Cancelling..." : "Yes, Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule modal */}
      {showReschedule && (
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
            {/* Drag handle */}
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

                {/* Current session */}
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
                      {booking.classType === "group" || booking.sessionType === "GROUP" ? <Bell s={20} /> : <User s={20} />}
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: "#f3ece1" }}>
                        {CLASS_MAP[booking.classType]?.label || CLASS_MAP[booking.sessionType]?.label || booking.classType}
                      </div>
                      <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "#b0a193" }}>
                        {fmtDate(booking.date)} · {booking.time}
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
                          position: "relative",
                        }}>
                          {date.getUTCDate()}
                          {hasOtherBooking && !isSelected && (
                            <span style={{
                              position: "absolute", bottom: 3, left: "50%", transform: "translateX(-50%)",
                              width: 5, height: 5, borderRadius: "50%", background: "#22c55e",
                            }} />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Calendar legend */}
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 16,
                    marginTop: 12, flexWrap: "wrap"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 12, height: 12, borderRadius: 3, background: "#1d1411", border: "1px solid #3a261d" }} />
                      <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "#78716c", letterSpacing: ".03em" }}>Available</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ position: "relative", width: 12, height: 12, borderRadius: 3, background: "rgba(34,197,94,.15)", border: "1px solid #22c55e" }}>
                        <span style={{ position: "absolute", bottom: 1, left: "50%", transform: "translateX(-50%)", width: 4, height: 4, borderRadius: "50%", background: "#22c55e" }} />
                      </span>
                      <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "#78716c", letterSpacing: ".03em" }}>You're booked</span>
                    </div>
                  </div>
                </div>

                {/* Time slots */}
                {selectedDate && (
                  <div style={{ marginBottom: 20 }}>
                    {/* Banner for days with other bookings */}
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
                          <div style={{ fontFamily: "var(--mono)", fontSize: 11, fontWeight: 600, color: "#22c55e", letterSpacing: ".03em", marginBottom: 4 }}>
                            You have another session this day
                          </div>
                          <div style={{ fontSize: 12, color: "#f3ece1", lineHeight: 1.4 }}>
                            {getOtherBookingsForDate(selectedDate).map((b) => (
                              <div key={b.id}>
                                {CLASS_MAP[b.classType]?.label || b.classType} · {b.time}
                              </div>
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

                {/* From → To comparison */}
                <div style={{ display: "flex", alignItems: "center", gap: 16, justifyContent: "center", marginBottom: 24 }}>
                  <div style={{ textAlign: "center", flex: 1 }}>
                    <div style={{ fontSize: 10, color: "#78716c", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 8 }}>From</div>
                    <div style={{ fontFamily: "var(--display)", fontSize: 16, color: "#78716c", textDecoration: "line-through", marginBottom: 4 }}>
                      {fmtDate(booking.date)}
                    </div>
                    <div style={{ fontFamily: "var(--mono)", fontSize: 14, color: "#78716c" }}>{booking.time}</div>
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
                  {CLASS_MAP[booking.classType]?.label || CLASS_MAP[booking.sessionType]?.label || booking.classType}
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
                      color: "#f3ece1", cursor: "pointer",
                      opacity: rescheduling ? 0.5 : 1
                    }}
                  >Back</button>
                  <button
                    onClick={handleReschedule}
                    disabled={rescheduling}
                    style={{
                      flex: 1, padding: "14px 20px", borderRadius: 10,
                      fontFamily: "var(--mono)", fontSize: 12, fontWeight: 700,
                      letterSpacing: ".06em", textTransform: "uppercase",
                      background: rescheduling ? "#281a15" : "linear-gradient(150deg, #e02d24, #c9251c)",
                      border: "none", color: rescheduling ? "#78716c" : "#fff",
                      cursor: rescheduling ? "not-allowed" : "pointer"
                    }}
                  >{rescheduling ? "Rescheduling..." : "Confirm Reschedule"}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
