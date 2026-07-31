"use client";
import React, { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Theme } from "@/app/theme";

const Lock = ({ s = 26 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="2" />
  </svg>
);

function ResetForm() {
  const router = useRouter();
  const token = useSearchParams().get("token") || "";

  const [checking, setChecking] = useState(true);
  const [valid, setValid] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  // Tell a dead link from a live one before asking someone to type a password.
  useEffect(() => {
    if (!token) { setChecking(false); return; }
    fetch(`/api/auth/reset?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((d) => setValid(Boolean(d.valid)))
      .catch(() => setValid(false))
      .finally(() => setChecking(false));
  }, [token]);

  const ok = password.length >= 8 && password === confirm;

  const submit = async () => {
    if (busy || !ok) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Could not reset your password.");

      // Straight into a session so they don't have to type it again.
      const signedIn = await signIn("credentials", {
        email: data.email,
        password,
        redirect: false,
      });
      router.push(signedIn?.error ? "/login" : "/");
      router.refresh();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };

  return (
    <div className="ign">
      <Theme />
      <div className="adm"><div className="wrap"><div className="gate">
        <div className="glock"><Lock /></div>

        {checking && <><h2>Checking…</h2><p>One moment.</p></>}

        {!checking && !valid && (
          <>
            <h2>Link Expired</h2>
            <p>That reset link is invalid or has already been used. Reset links work once and last an hour.</p>
            <a className="btn btn-primary" style={{ width: "100%" }} href="/forgot">Request a New Link</a>
            <div className="hint"><a href="/login" style={{ color: "var(--ember2)" }}>Back to sign in</a></div>
          </>
        )}

        {!checking && valid && (
          <>
            <h2>Choose a Password</h2>
            <p>Pick something at least 8 characters long.</p>
            <div className="field">
              <input type="password" value={password} placeholder="New password" autoComplete="new-password"
                onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="field">
              <input type="password" value={confirm} placeholder="Confirm password" autoComplete="new-password"
                onChange={(e) => setConfirm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()} />
            </div>
            {confirm && password !== confirm && <div className="auth-err">Those don't match.</div>}
            {error && <div className="auth-err">{error}</div>}
            <button className="btn btn-primary" style={{ width: "100%" }} disabled={busy || !ok} onClick={submit}>
              {busy ? "Saving…" : "Set Password & Sign In"}
            </button>
          </>
        )}
      </div></div></div>
    </div>
  );
}

export default function ResetPage() {
  return (
    <Suspense fallback={null}>
      <ResetForm />
    </Suspense>
  );
}
