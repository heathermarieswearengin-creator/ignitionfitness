"use client";
import { useState, useEffect, useCallback } from "react";

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

function studioNow() {
  const now = new Date();
  const pacific = new Date(now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
  const iso = pacific.toISOString().slice(0, 10);
  return { isoDay: iso };
}

const TABS = [
  { id: "block", label: "Block Time Off", icon: "🚫" },
  { id: "extra", label: "Add Extra Availability", icon: "➕" },
];

export default function AvailabilityPage() {
  const [activeTab, setActiveTab] = useState("block");
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const isMobile = useIsMobile();

  // Block form state
  const [blockForm, setBlockForm] = useState({
    date: "",
    isRange: false,
    endDate: "",
    allDay: true,
    startTime: "06:00",
    endTime: "18:00",
    reason: "",
  });

  // Extra availability form state
  const [extraForm, setExtraForm] = useState({
    date: "",
    startTime: "09:00",
    type: "PT",
    capacity: 1,
    durationMin: 60,
    notes: "",
  });

  const today = studioNow().isoDay;

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/blocks?from=${today}`).catch(() => null);
    setBlocks(res?.ok ? await res.json() : []);
    setLoading(false);
  }, [today]);

  useEffect(() => { load(); }, [load]);

  // Clear messages after delay
  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(null), 4000);
      return () => clearTimeout(t);
    }
  }, [success]);

  const addBlock = async (e) => {
    e.preventDefault();
    if (!blockForm.date || saving) return;
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        date: blockForm.date,
        ...(blockForm.isRange && blockForm.endDate ? { endDate: blockForm.endDate } : {}),
        allDay: blockForm.allDay,
        ...(blockForm.allDay ? {} : {
          startTime: blockForm.startTime,
          endTime: blockForm.endTime,
        }),
        reason: blockForm.reason || null,
      };

      const res = await fetch("/api/admin/blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Could not save that block.");

      const count = data?.count || 1;
      setSuccess(`Blocked ${count} day${count > 1 ? "s" : ""} successfully`);
      setBlockForm({ date: "", isRange: false, endDate: "", allDay: true, startTime: "06:00", endTime: "18:00", reason: "" });
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const addExtraSession = async (e) => {
    e.preventDefault();
    if (!extraForm.date || !extraForm.startTime || saving) return;
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/admin/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: extraForm.date,
          startTime: extraForm.startTime,
          type: extraForm.type,
          capacity: extraForm.capacity,
          durationMin: extraForm.durationMin,
          notes: extraForm.notes || null,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Could not create session.");

      setSuccess(`Extra ${extraForm.type === "PT" ? "PT" : "Group"} slot added for ${formatDate(extraForm.date)}`);
      setExtraForm({ date: "", startTime: "09:00", type: "PT", capacity: 1, durationMin: 60, notes: "" });
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const removeBlock = async (id) => {
    setBlocks(prev => prev.filter(b => b.id !== id));
    try {
      await fetch(`/api/admin/blocks/${id}`, { method: "DELETE" });
    } finally {
      await load();
    }
  };

  const formatDate = (date) => {
    const d = new Date(`${date}T00:00:00.000Z`);
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  };

  const formatTime = (time) => {
    const [h, m] = time.split(":").map(Number);
    const suffix = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
  };

  return (
    <div>
      <div className="adm-page-header">
        <h1>Availability</h1>
        <p>Block time off or add extra availability slots</p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexDirection: isMobile ? "column" : "row" }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setError(null); setSuccess(null); }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: isMobile ? "center" : "flex-start",
              gap: 8,
              padding: "12px 20px",
              minHeight: 44,
              background: activeTab === tab.id ? "#1c1917" : "white",
              color: activeTab === tab.id ? "white" : "#57534e",
              border: activeTab === tab.id ? "none" : "1px solid #e7e5e4",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s",
              flex: isMobile ? "none" : undefined,
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Success/Error messages */}
      {success && (
        <div style={{
          padding: 14,
          background: "#dcfce7",
          borderRadius: 10,
          color: "#166534",
          fontSize: 14,
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}>
          <span>✓</span>
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div style={{
          padding: 14,
          background: "#fef2f2",
          borderRadius: 10,
          color: "#991b1b",
          fontSize: 14,
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            style={{
              background: "transparent",
              border: "none",
              color: "#991b1b",
              cursor: "pointer",
              fontSize: 18,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
      )}

      {activeTab === "block" && (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 24 }}>
          {/* Block form */}
          <div className="adm-card">
            <h2 className="adm-card-title" style={{ marginBottom: 20 }}>Block Time Off</h2>

            <form onSubmit={addBlock}>
              {/* Single day vs Range toggle */}
              <div className="adm-field">
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setBlockForm({ ...blockForm, isRange: false, endDate: "" })}
                    style={{
                      flex: 1,
                      padding: "10px 16px",
                      minHeight: 44,
                      background: !blockForm.isRange ? "#1c1917" : "white",
                      color: !blockForm.isRange ? "white" : "#57534e",
                      border: !blockForm.isRange ? "none" : "1px solid #e7e5e4",
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Single Day
                  </button>
                  <button
                    type="button"
                    onClick={() => setBlockForm({ ...blockForm, isRange: true })}
                    style={{
                      flex: 1,
                      padding: "10px 16px",
                      minHeight: 44,
                      background: blockForm.isRange ? "#1c1917" : "white",
                      color: blockForm.isRange ? "white" : "#57534e",
                      border: blockForm.isRange ? "none" : "1px solid #e7e5e4",
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Date Range
                  </button>
                </div>
              </div>

              {/* Date inputs */}
              <div style={{ display: "grid", gridTemplateColumns: blockForm.isRange ? "1fr 1fr" : "1fr", gap: 12 }}>
                <div className="adm-field">
                  <label className="adm-label">{blockForm.isRange ? "Start Date" : "Date"}</label>
                  <input
                    type="date"
                    className="adm-input"
                    value={blockForm.date}
                    min={today}
                    onChange={e => setBlockForm({ ...blockForm, date: e.target.value })}
                    required
                  />
                </div>
                {blockForm.isRange && (
                  <div className="adm-field">
                    <label className="adm-label">End Date</label>
                    <input
                      type="date"
                      className="adm-input"
                      value={blockForm.endDate}
                      min={blockForm.date || today}
                      onChange={e => setBlockForm({ ...blockForm, endDate: e.target.value })}
                      required
                    />
                  </div>
                )}
              </div>

              {/* All day toggle */}
              <div className="adm-field">
                <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={blockForm.allDay}
                    onChange={e => setBlockForm({ ...blockForm, allDay: e.target.checked })}
                    style={{ width: 18, height: 18, accentColor: "#c9251c" }}
                  />
                  <span style={{ fontSize: 14, color: "#1c1917", fontWeight: 500 }}>All day</span>
                </label>
              </div>

              {/* Time range (when not all day) */}
              {!blockForm.allDay && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div className="adm-field">
                    <label className="adm-label">Start Time</label>
                    <input
                      type="time"
                      className="adm-input"
                      value={blockForm.startTime}
                      onChange={e => setBlockForm({ ...blockForm, startTime: e.target.value })}
                    />
                  </div>
                  <div className="adm-field">
                    <label className="adm-label">End Time</label>
                    <input
                      type="time"
                      className="adm-input"
                      value={blockForm.endTime}
                      onChange={e => setBlockForm({ ...blockForm, endTime: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {/* Reason */}
              <div className="adm-field">
                <label className="adm-label">Reason (optional)</label>
                <input
                  type="text"
                  className="adm-input"
                  value={blockForm.reason}
                  onChange={e => setBlockForm({ ...blockForm, reason: e.target.value })}
                  placeholder="e.g., Vacation, Doctor appointment"
                />
              </div>

              <button
                type="submit"
                className="adm-btn adm-btn-primary"
                style={{ width: "100%" }}
                disabled={saving || !blockForm.date || (blockForm.isRange && !blockForm.endDate)}
              >
                {saving ? "Saving..." : "Block This Time"}
              </button>
            </form>
          </div>

          {/* Blocked times list */}
          <div className="adm-card">
            <h2 className="adm-card-title" style={{ marginBottom: 20 }}>Blocked Times</h2>

            {loading ? (
              <div className="adm-empty" style={{ padding: 24 }}>
                <div className="adm-spinner" style={{ margin: "0 auto" }} />
              </div>
            ) : blocks.length === 0 ? (
              <div className="adm-empty" style={{ padding: 24 }}>
                <div className="adm-empty-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                </div>
                <p>No blocked times scheduled</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {blocks.map(block => (
                  <div key={block.id} style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: 14,
                    background: "#fafaf9",
                    borderRadius: 10,
                    gap: 12,
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: "#1c1917", fontSize: 14 }}>
                        {formatDate(block.date)}
                      </div>
                      <div style={{ fontSize: 13, color: "#78716c", marginTop: 2 }}>
                        {block.allDay ? "All day" : `${formatTime(block.startTime)} - ${formatTime(block.endTime)}`}
                        {block.reason && <span style={{ color: "#a8a29e" }}> · {block.reason}</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => removeBlock(block.id)}
                      style={{
                        padding: "8px 14px",
                        background: "white",
                        border: "1px solid #fecaca",
                        borderRadius: 8,
                        color: "#991b1b",
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "extra" && (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 24 }}>
          {/* Extra availability form */}
          <div className="adm-card">
            <h2 className="adm-card-title" style={{ marginBottom: 8 }}>Add Extra Availability</h2>
            <p style={{ fontSize: 13, color: "#78716c", marginBottom: 20 }}>
              Create a one-off session slot that's not part of your regular schedule.
            </p>

            <form onSubmit={addExtraSession}>
              <div className="adm-field">
                <label className="adm-label">Date</label>
                <input
                  type="date"
                  className="adm-input"
                  value={extraForm.date}
                  min={today}
                  onChange={e => setExtraForm({ ...extraForm, date: e.target.value })}
                  required
                />
              </div>

              <div className="adm-field">
                <label className="adm-label">Time</label>
                <input
                  type="time"
                  className="adm-input"
                  value={extraForm.startTime}
                  onChange={e => setExtraForm({ ...extraForm, startTime: e.target.value })}
                  required
                />
              </div>

              <div className="adm-field">
                <label className="adm-label">Session Type</label>
                <div style={{ display: "flex", gap: 8, flexDirection: isMobile ? "column" : "row" }}>
                  <button
                    type="button"
                    onClick={() => setExtraForm({ ...extraForm, type: "PT", capacity: 1 })}
                    style={{
                      flex: 1,
                      padding: "12px 16px",
                      minHeight: 44,
                      background: extraForm.type === "PT" ? "#1c1917" : "white",
                      color: extraForm.type === "PT" ? "white" : "#57534e",
                      border: extraForm.type === "PT" ? "none" : "1px solid #e7e5e4",
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    1:1 Personal Training
                  </button>
                  <button
                    type="button"
                    onClick={() => setExtraForm({ ...extraForm, type: "GROUP", capacity: 10 })}
                    style={{
                      flex: 1,
                      padding: "12px 16px",
                      minHeight: 44,
                      background: extraForm.type === "GROUP" ? "#1c1917" : "white",
                      color: extraForm.type === "GROUP" ? "white" : "#57534e",
                      border: extraForm.type === "GROUP" ? "none" : "1px solid #e7e5e4",
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Group Class
                  </button>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="adm-field">
                  <label className="adm-label">Duration</label>
                  <select
                    className="adm-input"
                    value={extraForm.durationMin}
                    onChange={e => setExtraForm({ ...extraForm, durationMin: Number(e.target.value) })}
                    style={{ cursor: "pointer" }}
                  >
                    <option value={30}>30 min</option>
                    <option value={45}>45 min</option>
                    <option value={60}>60 min</option>
                    <option value={90}>90 min</option>
                    <option value={120}>120 min</option>
                  </select>
                </div>
                <div className="adm-field">
                  <label className="adm-label">Capacity</label>
                  <input
                    type="number"
                    className="adm-input"
                    value={extraForm.capacity}
                    min={1}
                    max={50}
                    onChange={e => setExtraForm({ ...extraForm, capacity: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="adm-field">
                <label className="adm-label">Notes (optional)</label>
                <input
                  type="text"
                  className="adm-input"
                  value={extraForm.notes}
                  onChange={e => setExtraForm({ ...extraForm, notes: e.target.value })}
                  placeholder="e.g., Special Saturday session"
                />
              </div>

              <button
                type="submit"
                className="adm-btn adm-btn-primary"
                style={{ width: "100%" }}
                disabled={saving || !extraForm.date || !extraForm.startTime}
              >
                {saving ? "Creating..." : "Add Availability Slot"}
              </button>
            </form>
          </div>

          {/* Info panel */}
          <div className="adm-card" style={{ background: "#fafaf9" }}>
            <h2 className="adm-card-title" style={{ marginBottom: 16 }}>How It Works</h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "#dcfce7",
                  color: "#166534",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  fontWeight: 700,
                  flexShrink: 0,
                }}>1</div>
                <div>
                  <div style={{ fontWeight: 600, color: "#1c1917", marginBottom: 2 }}>One-off slots</div>
                  <div style={{ fontSize: 13, color: "#78716c" }}>
                    Create sessions that aren't part of your weekly template.
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "#dbeafe",
                  color: "#1e40af",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  fontWeight: 700,
                  flexShrink: 0,
                }}>2</div>
                <div>
                  <div style={{ fontWeight: 600, color: "#1c1917", marginBottom: 2 }}>Instant availability</div>
                  <div style={{ fontSize: 13, color: "#78716c" }}>
                    New slots appear immediately on the booking calendar.
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "#fef3c7",
                  color: "#92400e",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  fontWeight: 700,
                  flexShrink: 0,
                }}>3</div>
                <div>
                  <div style={{ fontWeight: 600, color: "#1c1917", marginBottom: 2 }}>Full control</div>
                  <div style={{ fontSize: 13, color: "#78716c" }}>
                    Perfect for holidays, makeup sessions, or special events.
                  </div>
                </div>
              </div>
            </div>

            <div style={{
              marginTop: 20,
              padding: 14,
              background: "white",
              borderRadius: 10,
              border: "1px solid #e7e5e4",
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#78716c", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
                Tip
              </div>
              <div style={{ fontSize: 13, color: "#57534e" }}>
                To see and manage all sessions (including extra ones), check the Schedule page.
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
