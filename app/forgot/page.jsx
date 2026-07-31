"use client";
import React, { useState } from "react";
import { Theme } from "@/app/theme";

const Key = ({ s = 26 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <circle cx="8" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
    <path d="M12 12h9m-3 0v4m-2-4v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export default function ForgotPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(null);
  const [error, setError] = useState(null);

  const valid = /\S+@\S+\.\S+/.test(email);

  const submit = async () => {
    if (busy || !valid) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Something went wrong. Try again.");
      setSent(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ign">
      <Theme />
      <div className="adm"><div className="wrap"><div className="gate">
        <div className="glock"><Key /></div>
        {sent ? (
          <>
            <h2>Check Your Email</h2>
            <p>{sent.message}</p>
            {sent.emailConfigured === false && (
              <p style={{ color: "var(--gold)", fontFamily: "var(--mono)", fontSize: 12.5, lineHeight: 1.6 }}>
                Give the studio a call and Coach Mike can sort it out for you.
              </p>
            )}
            <div className="hint"><a href="/login" style={{ color: "var(--ember2)" }}>Back to sign in</a></div>
          </>
        ) : (
          <>
            <h2>Forgot Password</h2>
            <p>Enter your email and we'll send you a link to choose a new password.</p>
            <div className="field">
              <input type="email" value={email} placeholder="you@email.com" autoComplete="email"
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()} />
            </div>
            {error && <div className="auth-err">{error}</div>}
            <button className="btn btn-primary" style={{ width: "100%" }} disabled={busy || !valid} onClick={submit}>
              {busy ? "Sending…" : "Send Reset Link"}
            </button>
            <div className="hint">
              <a href="/login" style={{ color: "var(--ember2)" }}>Back to sign in</a>
            </div>
          </>
        )}
      </div></div></div>
    </div>
  );
}
