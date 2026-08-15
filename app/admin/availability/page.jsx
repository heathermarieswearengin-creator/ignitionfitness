"use client";
import { useState, useEffect, useCallback } from "react";

function studioNow() {
  const now = new Date();
  const pacific = new Date(now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
  const iso = pacific.toISOString().slice(0, 10);
  return { isoDay: iso };
}

export default function AvailabilityPage() {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    date: "",
    allDay: true,
    startTime: "06:00",
    endTime: "12:00",
    reason: "",
  });

  const today = studioNow().isoDay;

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/blocks?from=${today}`).catch(() => null);
    setBlocks(res?.ok ? await res.json() : []);
    setLoading(false);
  }, [today]);

  useEffect(() => { load(); }, [load]);

  const addBlock = async (e) => {
    e.preventDefault();
    if (!form.date || saving) return;
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Could not save that block.");
      setForm({ date: "", allDay: true, startTime: "06:00", endTime: "12:00", reason: "" });
      await load();
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

  return (
    <div>
      <div className="adm-page-header">
        <h1>Availability</h1>
        <p>Block out dates or times when you're unavailable</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div className="adm-card">
          <h2 className="adm-card-title" style={{ marginBottom: 20 }}>Block Time Off</h2>

          <form onSubmit={addBlock}>
            <div className="adm-field">
              <label className="adm-label">Date</label>
              <input
                type="date"
                className="adm-input"
                value={form.date}
                min={today}
                onChange={e => setForm({ ...form, date: e.target.value })}
                required
              />
            </div>

            <div className="adm-field">
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={form.allDay}
                  onChange={e => setForm({ ...form, allDay: e.target.checked })}
                  style={{ width: 18, height: 18 }}
                />
                <span style={{ fontSize: 14, color: "#1c1917" }}>All day</span>
              </label>
            </div>

            {!form.allDay && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="adm-field">
                  <label className="adm-label">Start Time</label>
                  <input
                    type="time"
                    className="adm-input"
                    value={form.startTime}
                    onChange={e => setForm({ ...form, startTime: e.target.value })}
                  />
                </div>
                <div className="adm-field">
                  <label className="adm-label">End Time</label>
                  <input
                    type="time"
                    className="adm-input"
                    value={form.endTime}
                    onChange={e => setForm({ ...form, endTime: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div className="adm-field">
              <label className="adm-label">Reason (optional)</label>
              <input
                type="text"
                className="adm-input"
                value={form.reason}
                onChange={e => setForm({ ...form, reason: e.target.value })}
                placeholder="e.g., Vacation, Doctor appointment"
              />
            </div>

            {error && (
              <div style={{ padding: 12, background: "#fef2f2", borderRadius: 8, color: "#991b1b", fontSize: 14, marginBottom: 16 }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="adm-btn adm-btn-primary"
              style={{ width: "100%" }}
              disabled={saving || !form.date}
            >
              {saving ? "Saving..." : "Block This Time"}
            </button>
          </form>
        </div>

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
                  borderRadius: 8,
                  gap: 12,
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: "#1c1917" }}>
                      {formatDate(block.date)}
                    </div>
                    <div style={{ fontSize: 13, color: "#78716c" }}>
                      {block.allDay ? "All day" : `${block.startTime} - ${block.endTime}`}
                      {block.reason && ` · ${block.reason}`}
                    </div>
                  </div>
                  <button
                    onClick={() => removeBlock(block.id)}
                    style={{
                      padding: "6px 12px",
                      background: "#fef2f2",
                      border: "1px solid #fecaca",
                      borderRadius: 6,
                      color: "#991b1b",
                      fontSize: 13,
                      cursor: "pointer",
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

      <style>{`
        @media (max-width: 800px) {
          div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
