"use client";
import React, { useState } from "react";

const STATUSES = [
  ["new", "New"],
  ["contacted", "Contacted"],
  ["converted", "Converted"],
  ["dead", "Dead"],
];

const relTime = (ts) => {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

export function AdminLeads({ leads, reload }) {
  const [filter, setFilter] = useState("all");
  const [openId, setOpenId] = useState(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [converted, setConverted] = useState(null);

  const shown = leads
    .filter((l) => (filter === "all" ? true : l.status === filter))
    .sort((a, b) => b.createdAt - a.createdAt);

  const patch = async (id, body) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        throw new Error(d?.error || "Could not update that lead.");
      }
      await reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const convert = async (lead) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/leads/${lead.id}/convert`, { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Could not convert that lead.");
      setConverted(data);
      await reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const open = (l) => {
    if (openId === l.id) { setOpenId(null); return; }
    setOpenId(l.id);
    setDraft(l.notes || "");
    setError(null);
  };

  return (
    <div className="panel">
      <div className="panel-h">
        <h3>Leads</h3>
        <span className="cnt">{shown.length} shown</span>
      </div>

      <div className="filters" style={{ padding: "14px 22px 10px" }}>
        <button className={"fbtn" + (filter === "all" ? " on" : "")} onClick={() => setFilter("all")}>All</button>
        {STATUSES.map(([k, l]) => (
          <button key={k} className={"fbtn" + (filter === k ? " on" : "")} onClick={() => setFilter(k)}>
            {l} ({leads.filter((x) => x.status === k).length})
          </button>
        ))}
      </div>

      {converted && (
        <div className="convert-note">
          <strong>{converted.email}</strong> is now a member.
          {converted.adoptedBookings > 0 && ` ${converted.adoptedBookings} earlier booking${converted.adoptedBookings === 1 ? "" : "s"} moved onto their account.`}
          {converted.tempPassword ? (
            <>
              <br />Temporary password — shown once, share it with them:{" "}
              <code>{converted.tempPassword}</code>
            </>
          ) : (
            <><br />They already had an account, so their existing password still works.</>
          )}
          <button className="linkish" style={{ marginLeft: 10 }} onClick={() => setConverted(null)}>dismiss</button>
        </div>
      )}

      {error && <div className="blk-err" style={{ padding: "0 22px 12px" }}>{error}</div>}

      {shown.length === 0 && (
        <div className="empty">
          {filter === "all" ? "No leads yet. Drop-in bookings and the free-guide form feed this list." : "No leads with that status."}
        </div>
      )}

      {shown.map((l) => (
        <div key={l.id}>
          <button className="mem-row" onClick={() => open(l)}>
            <div className="bmeta">
              <div className="bn">{l.name || l.email}</div>
              <div className="bd">
                {l.name ? `${l.email} · ` : ""}{l.phone ? `${l.phone} · ` : ""}{relTime(l.createdAt)}
              </div>
            </div>
            <span className="lsrc">{l.source}</span>
            <span className={"badge lead-" + l.status}>{l.status}</span>
          </button>

          {openId === l.id && (
            <div className="mem-detail">
              <div className="filters" style={{ marginBottom: 12 }}>
                {STATUSES.map(([k, label]) => (
                  <button key={k} className={"fbtn" + (l.status === k ? " on" : "")}
                    disabled={busy} onClick={() => patch(l.id, { status: k })}>{label}</button>
                ))}
              </div>

              <textarea className="lead-notes" rows={3} placeholder="Notes — what did you talk about?"
                value={draft} onChange={(e) => setDraft(e.target.value)} />

              <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
                <button className="btn btn-ghost" disabled={busy || draft === (l.notes || "")}
                  onClick={() => patch(l.id, { notes: draft })}>Save notes</button>
                {l.status !== "converted" && (
                  <button className="btn btn-primary" disabled={busy} onClick={() => convert(l)}>
                    Convert to member
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
