"use client";
import React, { useState, useEffect, useCallback } from "react";

const fmtWhen = (ts) => {
  const d = new Date(ts);
  return `${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })} ${d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`;
};

const REASON_LABEL = {
  assigned: "assigned",
  "manual-add": "added by coach",
  "manual-remove": "removed by coach",
  booking: "spent on booking",
  "cancel-refund": "refunded on cancel",
};

export function AdminPackages() {
  const [members, setMembers] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [assignPick, setAssignPick] = useState("");
  const [adjust, setAdjust] = useState({ id: null, delta: "", note: "" });

  const load = useCallback(async () => {
    setLoading(true);
    const [m, c] = await Promise.all([
      fetch("/api/admin/members").then((r) => (r.ok ? r.json() : [])).catch(() => []),
      fetch("/api/admin/packages").then((r) => (r.ok ? r.json() : [])).catch(() => []),
    ]);
    setMembers(m);
    setCatalog(c);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openMember = async (id) => {
    if (openId === id) { setOpenId(null); setDetail(null); return; }
    setOpenId(id);
    setDetail(null);
    setError(null);
    const res = await fetch(`/api/admin/members/${id}`);
    setDetail(res.ok ? await res.json() : null);
  };

  const refreshDetail = async (id) => {
    const res = await fetch(`/api/admin/members/${id}`);
    setDetail(res.ok ? await res.json() : null);
    load();
  };

  const assign = async () => {
    if (!assignPick || !openId || busy) return;
    setBusy(true); setError(null);
    try {
      const res = await fetch(`/api/admin/members/${openId}/packages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: assignPick }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Could not assign that package.");
      setAssignPick("");
      await refreshDetail(openId);
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  const applyAdjust = async () => {
    const delta = Number(adjust.delta);
    if (!adjust.id || !Number.isInteger(delta) || delta === 0 || !adjust.note.trim() || busy) return;
    setBusy(true); setError(null);
    try {
      const res = await fetch(`/api/admin/member-packages/${adjust.id}/credits`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delta, note: adjust.note.trim() }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Could not adjust credits.");
      setAdjust({ id: null, delta: "", note: "" });
      await refreshDetail(openId);
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  return (
    <div className="panel">
      <div className="panel-h">
        <h3>Members &amp; Packages</h3>
        <span className="cnt">{members.length} members</span>
      </div>

      {loading && <div className="empty">Loading members…</div>}
      {!loading && members.length === 0 && (
        <div className="empty">No members have signed up yet.</div>
      )}

      {members.map((m) => {
        const live = m.packages.filter((p) => p.active && !p.expired);
        return (
          <div key={m.id}>
            <button className="mem-row" onClick={() => openMember(m.id)}>
              <div className="avatar">{m.name.split(" ").map((x) => x[0]).slice(0, 2).join("")}</div>
              <div className="bmeta">
                <div className="bn">{m.name}</div>
                <div className="bd">{m.email} · {m.bookingCount} bookings</div>
              </div>
              <div className="mem-packs">
                {live.length === 0 && <span className="pack-chip none">no package</span>}
                {live.map((p) => (
                  <span className={"pack-chip " + (p.type === "PT" ? "pt" : "group")} key={p.id}>
                    {p.unlimited ? `unlimited · to ${p.expiresAt}` : `${p.creditsRemaining} ${p.type === "PT" ? "1:1" : "group"}`}
                  </span>
                ))}
              </div>
            </button>

            {openId === m.id && (
              <div className="mem-detail">
                {!detail && <div className="empty">Loading…</div>}
                {error && <div className="blk-err" style={{ marginBottom: 12 }}>{error}</div>}

                {detail && (
                  <>
                    <div className="assign-row">
                      <select value={assignPick} onChange={(e) => setAssignPick(e.target.value)}>
                        <option value="">Assign a package…</option>
                        {catalog.filter((p) => p.active).map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} — ${p.price} ({p.unlimited ? `unlimited, ${p.durationDays}d` : `${p.totalCredits} credits`})
                          </option>
                        ))}
                      </select>
                      <button className="btn btn-primary" disabled={!assignPick || busy} onClick={assign}>
                        {busy ? "Saving…" : "Assign"}
                      </button>
                    </div>

                    {detail.packages.length === 0 && (
                      <div className="empty">No packages assigned yet.</div>
                    )}

                    {detail.packages.map((p) => (
                      <div className="pack-card" key={p.id}>
                        <div className="pack-head">
                          <div>
                            <div className="pk-name">{p.packageName ?? (p.type === "PT" ? "1:1 credits" : "Group credits")}</div>
                            <div className="pk-sub">
                              {p.unlimited
                                ? `Unlimited · ${p.expired ? "expired" : "valid to"} ${p.expiresAt ?? "—"}`
                                : `${p.creditsRemaining} credit${p.creditsRemaining === 1 ? "" : "s"} left`}
                              {p.expired && !p.unlimited && " · expired"}
                            </div>
                          </div>
                          {!p.unlimited && (
                            <button className="fbtn" onClick={() =>
                              setAdjust(adjust.id === p.id ? { id: null, delta: "", note: "" } : { id: p.id, delta: "", note: "" })}>
                              Adjust credits
                            </button>
                          )}
                        </div>

                        {adjust.id === p.id && (
                          <div className="adj-form">
                            <input type="number" placeholder="+2 or -1" value={adjust.delta}
                              onChange={(e) => setAdjust({ ...adjust, delta: e.target.value })} />
                            <input placeholder="Reason (required)" value={adjust.note}
                              onChange={(e) => setAdjust({ ...adjust, note: e.target.value })} />
                            <button className="btn btn-primary"
                              disabled={busy || !adjust.note.trim() || !Number(adjust.delta)}
                              onClick={applyAdjust}>Apply</button>
                          </div>
                        )}

                        <div className="pk-log">
                          {p.logs.length === 0 && <div className="pk-log-none">No activity yet.</div>}
                          {p.logs.map((l) => (
                            <div className="pk-log-row" key={l.id}>
                              <span className={"pk-delta " + (l.delta > 0 ? "up" : l.delta < 0 ? "down" : "flat")}>
                                {l.delta > 0 ? `+${l.delta}` : l.delta}
                              </span>
                              <span className="pk-reason">{REASON_LABEL[l.reason] ?? l.reason}</span>
                              {l.note && <span className="pk-note">{l.note}</span>}
                              <span className="pk-when">{fmtWhen(l.createdAt)}{l.admin ? ` · ${l.admin}` : ""}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
