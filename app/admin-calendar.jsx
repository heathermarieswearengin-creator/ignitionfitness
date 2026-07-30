"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { studioNow } from "@/lib/config";

const DOW_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// GROUP reads as the brand ember; PT as steel blue-grey. Fill intensity tracks
// how full the session is, so a glance shows both what and how busy.
const TYPE_RGB = { group: "224,45,36", pt: "111,138,153" };

/* ---- UTC date helpers: every key is a studio-local YYYY-MM-DD ---- */
const d0 = (isoDay) => new Date(`${isoDay}T00:00:00.000Z`);
const key = (d) => d.toISOString().slice(0, 10);
const addDays = (isoDay, n) => key(new Date(d0(isoDay).getTime() + n * 86400000));
const startOfWeek = (isoDay) => addDays(isoDay, -d0(isoDay).getUTCDay());
const startOfMonth = (isoDay) => `${isoDay.slice(0, 7)}-01`;
const addMonths = (isoDay, n) => {
  const d = d0(startOfMonth(isoDay));
  d.setUTCMonth(d.getUTCMonth() + n);
  return key(d);
};

function tileStyle(s) {
  const rgb = TYPE_RGB[s.classType] ?? TYPE_RGB.group;
  const ratio = s.capacity ? Math.min(1, s.booked / s.capacity) : 0;
  const full = ratio >= 1;
  return {
    borderColor: `rgb(${rgb})`,
    background: full ? `rgb(${rgb})` : ratio === 0 ? "transparent" : `rgba(${rgb},${0.15 + 0.4 * ratio})`,
    color: full ? "#140d0b" : "var(--bone)",
    opacity: s.status === "CANCELLED" || s.blocked ? 0.4 : s.past ? 0.62 : 1,
  };
}

function Tile({ s, compact, onClick }) {
  const label = s.classType === "pt" ? "1:1" : "Group";
  return (
    <button className={"cal-tile" + (compact ? " compact" : "")} style={tileStyle(s)} onClick={() => onClick(s)}
      title={`${s.time} · ${label} · ${s.booked}/${s.capacity}${s.blocked ? " · blocked" : ""}`}>
      <span className="ct-time">{s.time.replace(":00", "")}</span>
      {!compact && <span className="ct-type">{label}</span>}
      <span className="ct-cnt">{s.booked}/{s.capacity}</span>
    </button>
  );
}

export function AdminCalendar({ updateBooking, refreshKey }) {
  const today = studioNow().isoDay;
  const [mode, setMode] = useState("week");
  const [anchor, setAnchor] = useState(today);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const range = useMemo(() => {
    if (mode === "week") {
      const from = startOfWeek(anchor);
      return { from, to: addDays(from, 6) };
    }
    const first = startOfMonth(anchor);
    const from = startOfWeek(first);
    return { from, to: addDays(from, 41) }; // 6 weeks covers any month layout
  }, [mode, anchor]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/sessions?from=${range.from}&to=${range.to}`);
      setSessions(res.ok ? await res.json() : []);
    } catch {
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [range.from, range.to]);

  useEffect(() => { load(); }, [load, refreshKey]);

  // Keep the open attendee panel in sync after a check-in or cancel.
  useEffect(() => {
    if (!selected) return;
    const fresh = sessions.find((s) => s.sessionId === selected.sessionId);
    if (fresh) setSelected(fresh);
  }, [sessions]); // eslint-disable-line react-hooks/exhaustive-deps

  const byDay = useMemo(() => {
    const m = new Map();
    for (const s of sessions) {
      if (!m.has(s.date)) m.set(s.date, []);
      m.get(s.date).push(s);
    }
    return m;
  }, [sessions]);

  const days = useMemo(() => {
    const n = mode === "week" ? 7 : 42;
    return Array.from({ length: n }, (_, i) => addDays(range.from, i));
  }, [mode, range.from]);

  const step = (dir) =>
    setAnchor(mode === "week" ? addDays(anchor, dir * 7) : addMonths(anchor, dir));

  const heading =
    mode === "week"
      ? `${MON[d0(range.from).getUTCMonth()]} ${d0(range.from).getUTCDate()} – ${MON[d0(range.to).getUTCMonth()]} ${d0(range.to).getUTCDate()}`
      : `${MON[d0(startOfMonth(anchor)).getUTCMonth()]} ${d0(anchor).getUTCFullYear()}`;

  const totals = sessions.reduce(
    (a, s) => {
      if (s.status !== "CANCELLED" && !s.blocked) { a.booked += s.booked; a.seats += s.capacity; }
      return a;
    },
    { booked: 0, seats: 0 }
  );

  return (
    <div className="panel">
      <div className="panel-h">
        <h3>Schedule</h3>
        <span className="cnt">{totals.booked}/{totals.seats} seats booked</span>
      </div>

      <div className="cal-bar">
        <div className="filters" style={{ margin: 0 }}>
          <button className={"fbtn" + (mode === "week" ? " on" : "")} onClick={() => setMode("week")}>Week</button>
          <button className={"fbtn" + (mode === "month" ? " on" : "")} onClick={() => setMode("month")}>Month</button>
        </div>
        <div className="cal-nav">
          <button className="fbtn" onClick={() => step(-1)}>‹</button>
          <button className="fbtn" onClick={() => setAnchor(today)}>Today</button>
          <button className="fbtn" onClick={() => step(1)}>›</button>
        </div>
        <div className="cal-title">{heading}</div>
      </div>

      <div className="cal-legend">
        <span><i style={{ background: `rgb(${TYPE_RGB.group})` }} />Group Class</span>
        <span><i style={{ background: `rgb(${TYPE_RGB.pt})` }} />1:1 Personal Training</span>
        <span className="cal-legend-note">Solid = full · faded = past or blocked</span>
      </div>

      {loading && <div className="empty">Loading schedule…</div>}

      {!loading && mode === "week" && (
        <div className="cal-week">
          {days.map((d) => {
            const list = byDay.get(d) ?? [];
            return (
              <div className={"cal-day" + (d === today ? " is-today" : "")} key={d}>
                <div className="cal-dh">
                  <span className="cd-dow">{DOW_SHORT[d0(d).getUTCDay()]}</span>
                  <span className="cd-num">{d0(d).getUTCDate()}</span>
                </div>
                <div className="cal-stack">
                  {list.length === 0 && <div className="cal-none">—</div>}
                  {list.map((s) => <Tile key={s.sessionId} s={s} onClick={setSelected} />)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && mode === "month" && (
        <div className="cal-month">
          {DOW_SHORT.map((d) => <div className="cal-mh" key={d}>{d}</div>)}
          {days.map((d) => {
            const list = byDay.get(d) ?? [];
            const outside = d.slice(0, 7) !== startOfMonth(anchor).slice(0, 7);
            return (
              <div className={"cal-cell" + (d === today ? " is-today" : "") + (outside ? " outside" : "")} key={d}>
                <div className="cc-num">{d0(d).getUTCDate()}</div>
                <div className="cc-stack">
                  {list.map((s) => <Tile key={s.sessionId} s={s} compact onClick={setSelected} />)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selected && (
        <AttendeePanel
          session={selected}
          onClose={() => setSelected(null)}
          updateBooking={updateBooking}
          reload={load}
        />
      )}
    </div>
  );
}

function AttendeePanel({ session, onClose, updateBooking, reload }) {
  const [busy, setBusy] = useState(null);

  const act = async (bookingId, status) => {
    setBusy(bookingId);
    try {
      await updateBooking(bookingId, { status });
      await reload();
    } finally {
      setBusy(null);
    }
  };

  const live = session.attendees.filter((a) => a.status !== "cancelled");

  return (
    <div className="cal-overlay" onClick={onClose}>
      <div className="cal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="panel-h">
          <h3>
            {session.classType === "pt" ? "1:1 Personal Training" : "Group Class"}
            <small style={{ display: "block", fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--ash)", marginTop: 4, letterSpacing: ".04em" }}>
              {DOW_SHORT[d0(session.date).getUTCDay()]}, {MON[d0(session.date).getUTCMonth()]} {d0(session.date).getUTCDate()} · {session.time}
              {session.blocked && " · BLOCKED"}
              {session.past && " · PAST"}
            </small>
          </h3>
          <span className="cnt">{live.length}/{session.capacity}</span>
        </div>

        {session.attendees.length === 0 && <div className="empty">Nobody booked in yet.</div>}

        {session.attendees.map((a) => (
          <div className="book-row" key={a.bookingId}>
            <div className="avatar">{a.name.split(" ").map((x) => x[0]).slice(0, 2).join("")}</div>
            <div className="bmeta">
              <div className="bn">
                {a.name}
                {a.isDropIn && <span className="lsrc" style={{ marginLeft: 8 }}>drop-in</span>}
                {!a.isMember && !a.isDropIn && <span className="lsrc" style={{ marginLeft: 8 }}>guest</span>}
                {a.paymentStatus === "PACKAGE" && <span className="lsrc" style={{ marginLeft: 8 }}>package</span>}
              </div>
              <div className="bd">{a.email}{a.phone ? ` · ${a.phone}` : ""} · {a.ref}</div>
            </div>
            <span className={"badge bg-" + a.status}>{a.status.replace("-", " ")}</span>
            <div className="row-acts">
              {a.status !== "checked-in" && a.status !== "cancelled" && (
                <button className="iact go" title="Check in" disabled={busy === a.bookingId}
                  onClick={() => act(a.bookingId, "checked-in")}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12l4.5 4.5L19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              )}
              {a.status !== "cancelled" && (
                <button className="iact no" title="Cancel" disabled={busy === a.bookingId}
                  onClick={() => act(a.bookingId, "cancelled")}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>
                </button>
              )}
            </div>
          </div>
        ))}

        <div style={{ padding: 18, textAlign: "right" }}>
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
