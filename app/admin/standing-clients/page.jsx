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

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_OPTIONS = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 0, label: "Sun" },
];

function studioNow() {
  const now = new Date();
  const pacific = new Date(now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
  return pacific.toISOString().slice(0, 10);
}

function to12h(time24) {
  const [h, m] = time24.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${suffix}`;
}

function getInitials(name) {
  return (name || "")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function StandingClientsPage() {
  const [standingClients, setStandingClients] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form state
  const [form, setForm] = useState({
    memberId: "",
    memberSearch: "",
    daysOfWeek: [],
    startTime: "06:00",
    endDate: "",
    ongoing: true,
  });
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  // Conflict resolution state
  const [conflicts, setConflicts] = useState(null);
  const [conflictResolutions, setConflictResolutions] = useState({});

  // Edit modal state
  const [editingClient, setEditingClient] = useState(null);
  const [editForm, setEditForm] = useState(null);

  // Skip modal state
  const [skippingClient, setSkippingClient] = useState(null);
  const [skipDate, setSkipDate] = useState("");
  const [skipReason, setSkipReason] = useState("");

  // Delete confirmation
  const [deletingClient, setDeletingClient] = useState(null);

  const isMobile = useIsMobile();
  const today = studioNow();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [scRes, membersRes] = await Promise.all([
        fetch("/api/admin/standing-clients"),
        fetch("/api/admin/members"),
      ]);
      if (scRes.ok) setStandingClients(await scRes.json());
      if (membersRes.ok) {
        const data = await membersRes.json();
        setMembers(data.filter((m) => !m.archived));
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredMembers = members.filter(
    (m) =>
      form.memberSearch &&
      (m.name.toLowerCase().includes(form.memberSearch.toLowerCase()) ||
        m.email.toLowerCase().includes(form.memberSearch.toLowerCase()))
  );

  const selectMember = (member) => {
    setSelectedMember(member);
    setForm({ ...form, memberId: member.id, memberSearch: member.name });
    setShowMemberDropdown(false);
  };

  const toggleDay = (day) => {
    setForm((f) => ({
      ...f,
      daysOfWeek: f.daysOfWeek.includes(day)
        ? f.daysOfWeek.filter((d) => d !== day)
        : [...f.daysOfWeek, day].sort((a, b) => a - b),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.memberId || form.daysOfWeek.length === 0) {
      setError("Please select a member and at least one day");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        memberId: form.memberId,
        daysOfWeek: form.daysOfWeek,
        startTime: form.startTime,
        durationMin: 60,
        endDate: form.ongoing ? null : form.endDate || null,
        conflictResolutions: conflicts ? Object.entries(conflictResolutions).map(([date, action]) => ({ date, action })) : undefined,
      };

      const res = await fetch("/api/admin/standing-clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.status === 409 && data.conflicts) {
        // Show conflict resolution UI
        setConflicts(data.conflicts);
        // Default to "skip" for conflicts with other people, "keep" for same person
        const defaultResolutions = {};
        data.conflicts.forEach((c) => {
          defaultResolutions[c.date] = c.isSamePerson ? "keep" : "skip";
        });
        setConflictResolutions(defaultResolutions);
        setSaving(false);
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || "Failed to create standing client");
      }

      // Success
      setSuccess(`Standing client created for ${selectedMember?.name || "member"}`);
      setForm({
        memberId: "",
        memberSearch: "",
        daysOfWeek: [],
        startTime: "06:00",
        endDate: "",
        ongoing: true,
      });
      setSelectedMember(null);
      setConflicts(null);
      setConflictResolutions({});
      await loadData();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingClient) return;
    try {
      await fetch(`/api/admin/standing-clients/${deletingClient.id}`, { method: "DELETE" });
      setDeletingClient(null);
      await loadData();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleSkip = async () => {
    if (!skippingClient || !skipDate) return;
    try {
      const res = await fetch(`/api/admin/standing-clients/${skippingClient.id}/skip`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: skipDate, reason: skipReason || undefined }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to skip date");
      }
      setSkippingClient(null);
      setSkipDate("");
      setSkipReason("");
      await loadData();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleUpdate = async () => {
    if (!editingClient || !editForm) return;
    try {
      const res = await fetch(`/api/admin/standing-clients/${editingClient.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          daysOfWeek: editForm.daysOfWeek,
          startTime: editForm.startTime,
          endDate: editForm.ongoing ? null : editForm.endDate || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update");
      }
      setEditingClient(null);
      setEditForm(null);
      await loadData();
    } catch (e) {
      setError(e.message);
    }
  };

  const openEdit = (sc) => {
    setEditingClient(sc);
    setEditForm({
      daysOfWeek: sc.daysOfWeek,
      startTime: sc.startTime,
      endDate: sc.endDate || "",
      ongoing: !sc.endDate,
    });
  };

  const activeClients = standingClients.filter((sc) => sc.active && !sc.ended);
  const endedClients = standingClients.filter((sc) => !sc.active || sc.ended);

  return (
    <div>
      <div className="adm-page-header">
        <h1>Standing Clients</h1>
        <p>Manage recurring weekly 1:1 appointments</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 24 }}>
        {/* Add Form */}
        <div className="adm-card">
          <h2 className="adm-card-title" style={{ marginBottom: 20 }}>Add Standing Client</h2>

          <form onSubmit={handleSubmit}>
            {/* Member Search */}
            <div className="adm-field" style={{ position: "relative" }}>
              <label className="adm-label">Client</label>
              <input
                type="text"
                className="adm-input"
                placeholder="Search members..."
                value={form.memberSearch}
                onChange={(e) => {
                  setForm({ ...form, memberSearch: e.target.value, memberId: "" });
                  setSelectedMember(null);
                  setShowMemberDropdown(true);
                }}
                onFocus={() => setShowMemberDropdown(true)}
              />
              {showMemberDropdown && filteredMembers.length > 0 && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    background: "#fff",
                    border: "1px solid #e7e5e4",
                    borderRadius: 8,
                    boxShadow: "0 4px 12px rgba(0,0,0,.1)",
                    zIndex: 100,
                    maxHeight: 200,
                    overflowY: "auto",
                  }}
                >
                  {filteredMembers.slice(0, 10).map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => selectMember(m)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        width: "100%",
                        padding: "10px 12px",
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                      onMouseEnter={(e) => (e.target.style.background = "#fafaf9")}
                      onMouseLeave={(e) => (e.target.style.background = "transparent")}
                    >
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: "#e02d24",
                          color: "#fff",
                          display: "grid",
                          placeItems: "center",
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        {getInitials(m.name)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500, color: "#1c1917" }}>{m.name}</div>
                        <div style={{ fontSize: 12, color: "#78716c" }}>{m.email}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {selectedMember && (
                <div
                  style={{
                    marginTop: 8,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 12px",
                    background: "#f0fdf4",
                    borderRadius: 8,
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 7,
                      background: "#22c55e",
                      color: "#fff",
                      display: "grid",
                      placeItems: "center",
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    {getInitials(selectedMember.name)}
                  </div>
                  <span style={{ fontSize: 14, color: "#166534" }}>{selectedMember.name}</span>
                </div>
              )}
            </div>

            {/* Days of Week */}
            <div className="adm-field">
              <label className="adm-label">Days</label>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(4, 1fr)" : "repeat(7, 1fr)", gap: 6 }}>
                {DAY_OPTIONS.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => toggleDay(d.value)}
                    style={{
                      padding: isMobile ? "12px 8px" : "8px 14px",
                      minHeight: 44,
                      border: "1.5px solid",
                      borderColor: form.daysOfWeek.includes(d.value) ? "#e02d24" : "#d6d3d1",
                      borderRadius: 8,
                      background: form.daysOfWeek.includes(d.value) ? "#fef2f2" : "#fff",
                      color: form.daysOfWeek.includes(d.value) ? "#e02d24" : "#57534e",
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Time */}
            <div className="adm-field">
              <label className="adm-label">Time</label>
              <input
                type="time"
                className="adm-input"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
              />
            </div>

            {/* End Date */}
            <div className="adm-field">
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: 8 }}>
                <input
                  type="checkbox"
                  checked={form.ongoing}
                  onChange={(e) => setForm({ ...form, ongoing: e.target.checked })}
                  style={{ width: 18, height: 18 }}
                />
                <span style={{ fontSize: 14, color: "#1c1917" }}>Ongoing (no end date)</span>
              </label>
              {!form.ongoing && (
                <input
                  type="date"
                  className="adm-input"
                  value={form.endDate}
                  min={today}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                />
              )}
            </div>

            {error && (
              <div
                style={{
                  padding: 12,
                  background: "#fef2f2",
                  borderRadius: 8,
                  color: "#991b1b",
                  fontSize: 14,
                  marginBottom: 16,
                }}
              >
                {error}
                <button
                  type="button"
                  onClick={() => setError(null)}
                  style={{
                    marginLeft: 8,
                    padding: "2px 8px",
                    background: "transparent",
                    border: "1px solid #fecaca",
                    borderRadius: 4,
                    color: "#991b1b",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  Dismiss
                </button>
              </div>
            )}

            {success && (
              <div
                style={{
                  padding: 12,
                  background: "#f0fdf4",
                  borderRadius: 8,
                  color: "#166534",
                  fontSize: 14,
                  marginBottom: 16,
                }}
              >
                {success}
              </div>
            )}

            <button
              type="submit"
              className="adm-btn adm-btn-primary"
              style={{ width: "100%" }}
              disabled={saving || !form.memberId || form.daysOfWeek.length === 0}
            >
              {saving ? "Saving..." : "Add Standing Client"}
            </button>
          </form>
        </div>

        {/* List */}
        <div className="adm-card">
          <h2 className="adm-card-title" style={{ marginBottom: 20 }}>Active Standing Clients</h2>

          {loading ? (
            <div className="adm-empty" style={{ padding: 24 }}>
              <div className="adm-spinner" style={{ margin: "0 auto" }} />
            </div>
          ) : activeClients.length === 0 ? (
            <div className="adm-empty" style={{ padding: 24 }}>
              <div className="adm-empty-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <p>No standing clients yet</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {activeClients.map((sc) => (
                <div
                  key={sc.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: 14,
                    background: "#fafaf9",
                    borderRadius: 10,
                    border: "1px solid #e7e5e4",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: "#7c3aed",
                        color: "#fff",
                        display: "grid",
                        placeItems: "center",
                        fontSize: 14,
                        fontWeight: 600,
                      }}
                    >
                      {getInitials(sc.memberName)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: "#1c1917" }}>{sc.memberName}</div>
                      <div style={{ fontSize: 13, color: "#78716c" }}>
                        Every {sc.daysLabel} · {to12h(sc.startTime)} · {sc.endDate ? `Until ${sc.endDate}` : "Ongoing"}
                      </div>
                      {sc.upcomingSkips?.length > 0 && (
                        <div style={{ fontSize: 12, color: "#f59e0b", marginTop: 2 }}>
                          Skipping: {sc.upcomingSkips.join(", ")}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ position: "relative" }}>
                    <button
                      onClick={(e) => {
                        const menu = e.currentTarget.nextElementSibling;
                        menu.style.display = menu.style.display === "none" ? "block" : "none";
                      }}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 6,
                        border: "1px solid #e7e5e4",
                        background: "#fff",
                        cursor: "pointer",
                        display: "grid",
                        placeItems: "center",
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="12" cy="5" r="2" />
                        <circle cx="12" cy="12" r="2" />
                        <circle cx="12" cy="19" r="2" />
                      </svg>
                    </button>
                    <div
                      style={{
                        display: "none",
                        position: "absolute",
                        top: "100%",
                        right: 0,
                        background: "#fff",
                        border: "1px solid #e7e5e4",
                        borderRadius: 8,
                        boxShadow: "0 4px 12px rgba(0,0,0,.1)",
                        zIndex: 50,
                        minWidth: 140,
                        overflow: "hidden",
                      }}
                    >
                      <button
                        onClick={() => openEdit(sc)}
                        style={{
                          display: "block",
                          width: "100%",
                          padding: "10px 14px",
                          border: "none",
                          background: "transparent",
                          textAlign: "left",
                          cursor: "pointer",
                          fontSize: 14,
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setSkippingClient(sc)}
                        style={{
                          display: "block",
                          width: "100%",
                          padding: "10px 14px",
                          border: "none",
                          background: "transparent",
                          textAlign: "left",
                          cursor: "pointer",
                          fontSize: 14,
                        }}
                      >
                        Skip Next
                      </button>
                      <hr style={{ margin: 0, border: "none", borderTop: "1px solid #e7e5e4" }} />
                      <button
                        onClick={() => setDeletingClient(sc)}
                        style={{
                          display: "block",
                          width: "100%",
                          padding: "10px 14px",
                          border: "none",
                          background: "transparent",
                          textAlign: "left",
                          cursor: "pointer",
                          fontSize: 14,
                          color: "#dc2626",
                        }}
                      >
                        Remove...
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {endedClients.length > 0 && (
            <>
              <h3 style={{ marginTop: 24, marginBottom: 12, fontSize: 14, color: "#78716c", fontWeight: 600 }}>
                Ended / Inactive
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, opacity: 0.6 }}>
                {endedClients.map((sc) => (
                  <div
                    key={sc.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: 12,
                      background: "#fafaf9",
                      borderRadius: 8,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: "#a8a29e",
                          color: "#fff",
                          display: "grid",
                          placeItems: "center",
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        {getInitials(sc.memberName)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500, color: "#78716c" }}>{sc.memberName}</div>
                        <div style={{ fontSize: 12, color: "#a8a29e" }}>
                          {sc.daysLabel} · {to12h(sc.startTime)}
                        </div>
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "4px 10px",
                        borderRadius: 12,
                        background: "#e7e5e4",
                        color: "#78716c",
                      }}
                    >
                      ENDED
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Conflict Resolution Modal */}
      {conflicts && (
        <div
          onClick={() => {
            setConflicts(null);
            setConflictResolutions({});
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: 16,
              width: "100%",
              maxWidth: 500,
              maxHeight: "80vh",
              overflow: "auto",
            }}
          >
            <div style={{ padding: 24, borderBottom: "1px solid #e7e5e4" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#f59e0b", marginBottom: 8 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <span style={{ fontWeight: 600 }}>Scheduling Conflicts</span>
              </div>
              <p style={{ color: "#57534e", fontSize: 14, margin: 0 }}>
                The following dates already have 1:1 bookings at {to12h(form.startTime)}. Choose how to handle each one.
              </p>
            </div>

            <div style={{ padding: 16 }}>
              {conflicts.map((c) => (
                <div
                  key={c.date}
                  style={{
                    padding: 16,
                    background: "#fafaf9",
                    borderRadius: 10,
                    marginBottom: 12,
                  }}
                >
                  <div style={{ fontWeight: 600, color: "#1c1917", marginBottom: 4 }}>
                    {new Date(`${c.date}T00:00:00.000Z`).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })} · {to12h(form.startTime)}
                  </div>
                  <div style={{ fontSize: 13, color: "#78716c", marginBottom: 12 }}>
                    Currently booked by: <strong>{c.bookedBy}</strong>
                    {c.isSamePerson && " (same as standing client)"}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {c.isSamePerson ? (
                      <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                        <input
                          type="radio"
                          name={`conflict-${c.date}`}
                          checked={conflictResolutions[c.date] === "keep"}
                          onChange={() => setConflictResolutions({ ...conflictResolutions, [c.date]: "keep" })}
                        />
                        <span style={{ fontSize: 14 }}>Keep as-is (same person)</span>
                      </label>
                    ) : (
                      <>
                        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                          <input
                            type="radio"
                            name={`conflict-${c.date}`}
                            checked={conflictResolutions[c.date] === "cancel"}
                            onChange={() => setConflictResolutions({ ...conflictResolutions, [c.date]: "cancel" })}
                          />
                          <span style={{ fontSize: 14, color: "#dc2626" }}>
                            Cancel {c.bookedBy}'s booking (sends email)
                          </span>
                        </label>
                        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                          <input
                            type="radio"
                            name={`conflict-${c.date}`}
                            checked={conflictResolutions[c.date] === "skip"}
                            onChange={() => setConflictResolutions({ ...conflictResolutions, [c.date]: "skip" })}
                          />
                          <span style={{ fontSize: 14 }}>Skip this date for standing client</span>
                        </label>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ padding: 16, borderTop: "1px solid #e7e5e4", display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button
                onClick={() => {
                  setConflicts(null);
                  setConflictResolutions({});
                }}
                style={{
                  padding: "10px 20px",
                  border: "1px solid #d6d3d1",
                  borderRadius: 8,
                  background: "#fff",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="adm-btn adm-btn-primary"
              >
                {saving ? "Creating..." : "Resolve & Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingClient && (
        <div
          onClick={() => setDeletingClient(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: 16,
              width: "100%",
              maxWidth: 400,
              padding: 24,
            }}
          >
            <h3 style={{ margin: "0 0 12px", color: "#1c1917" }}>Remove Standing Client?</h3>
            <p style={{ color: "#57534e", fontSize: 14, marginBottom: 20 }}>
              This will remove <strong>{deletingClient.memberName}</strong>'s recurring appointment. The time slot will become available for booking again.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button
                onClick={() => setDeletingClient(null)}
                style={{
                  padding: "10px 20px",
                  border: "1px solid #d6d3d1",
                  borderRadius: 8,
                  background: "#fff",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                style={{
                  padding: "10px 20px",
                  border: "none",
                  borderRadius: 8,
                  background: "#dc2626",
                  color: "#fff",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Skip Modal */}
      {skippingClient && (
        <div
          onClick={() => {
            setSkippingClient(null);
            setSkipDate("");
            setSkipReason("");
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: 16,
              width: "100%",
              maxWidth: 400,
              padding: 24,
            }}
          >
            <h3 style={{ margin: "0 0 12px", color: "#1c1917" }}>Skip Occurrence</h3>
            <p style={{ color: "#57534e", fontSize: 14, marginBottom: 16 }}>
              Skip a single date for <strong>{skippingClient.memberName}</strong>. The slot will be available for others to book on that date.
            </p>
            <div className="adm-field">
              <label className="adm-label">Date to Skip</label>
              <input
                type="date"
                className="adm-input"
                value={skipDate}
                min={today}
                onChange={(e) => setSkipDate(e.target.value)}
              />
            </div>
            <div className="adm-field">
              <label className="adm-label">Reason (optional)</label>
              <input
                type="text"
                className="adm-input"
                value={skipReason}
                onChange={(e) => setSkipReason(e.target.value)}
                placeholder="e.g., Client on vacation"
              />
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 20 }}>
              <button
                onClick={() => {
                  setSkippingClient(null);
                  setSkipDate("");
                  setSkipReason("");
                }}
                style={{
                  padding: "10px 20px",
                  border: "1px solid #d6d3d1",
                  borderRadius: 8,
                  background: "#fff",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSkip}
                disabled={!skipDate}
                className="adm-btn adm-btn-primary"
              >
                Skip This Date
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingClient && editForm && (
        <div
          onClick={() => {
            setEditingClient(null);
            setEditForm(null);
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: 16,
              width: "100%",
              maxWidth: 450,
              padding: 24,
            }}
          >
            <h3 style={{ margin: "0 0 16px", color: "#1c1917" }}>Edit Standing Client</h3>
            <p style={{ color: "#57534e", fontSize: 14, marginBottom: 20 }}>
              Editing <strong>{editingClient.memberName}</strong>
            </p>

            <div className="adm-field">
              <label className="adm-label">Days</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
                {DAY_OPTIONS.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() =>
                      setEditForm((f) => ({
                        ...f,
                        daysOfWeek: f.daysOfWeek.includes(d.value)
                          ? f.daysOfWeek.filter((x) => x !== d.value)
                          : [...f.daysOfWeek, d.value].sort((a, b) => a - b),
                      }))
                    }
                    style={{
                      padding: "12px 8px",
                      minHeight: 44,
                      border: "1.5px solid",
                      borderColor: editForm.daysOfWeek.includes(d.value) ? "#e02d24" : "#d6d3d1",
                      borderRadius: 8,
                      background: editForm.daysOfWeek.includes(d.value) ? "#fef2f2" : "#fff",
                      color: editForm.daysOfWeek.includes(d.value) ? "#e02d24" : "#57534e",
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="adm-field">
              <label className="adm-label">Time</label>
              <input
                type="time"
                className="adm-input"
                value={editForm.startTime}
                onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })}
              />
            </div>

            <div className="adm-field">
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: 8 }}>
                <input
                  type="checkbox"
                  checked={editForm.ongoing}
                  onChange={(e) => setEditForm({ ...editForm, ongoing: e.target.checked })}
                  style={{ width: 18, height: 18 }}
                />
                <span style={{ fontSize: 14, color: "#1c1917" }}>Ongoing (no end date)</span>
              </label>
              {!editForm.ongoing && (
                <input
                  type="date"
                  className="adm-input"
                  value={editForm.endDate}
                  min={today}
                  onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                />
              )}
            </div>

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 20 }}>
              <button
                onClick={() => {
                  setEditingClient(null);
                  setEditForm(null);
                }}
                style={{
                  padding: "10px 20px",
                  border: "1px solid #d6d3d1",
                  borderRadius: 8,
                  background: "#fff",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button onClick={handleUpdate} className="adm-btn adm-btn-primary">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
