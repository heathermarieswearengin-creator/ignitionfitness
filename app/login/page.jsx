"use client";
import React, { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Theme } from "@/app/theme";

const Lock = ({ s = 26 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="2" />
  </svg>
);

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const submit = async () => {
    if (busy || !email || !password) return;
    setBusy(true);
    setError(null);
    const res = await signIn("credentials", { email, password, redirect: false });
    if (res?.error) {
      setError("That email and password don't match an account.");
      setBusy(false);
      return;
    }
    // Small delay to ensure session cookie is fully established
    await new Promise(r => setTimeout(r, 100));
    // Fetch user role from server with cache bypass
    const me = await fetch("/api/me", { cache: "no-store" }).then(r => r.json()).catch(() => ({}));
    // Admin users always go to /admin
    if (me?.user?.role === "ADMIN") {
      window.location.href = "/admin";
    } else {
      window.location.href = next;
    }
  };

  return (
    <div className="ign">
      <Theme />
      <div className="adm"><div className="wrap"><div className="gate">
        <div className="glock"><Lock /></div>
        <h2>Sign In</h2>
        <p>Members and coaches sign in here to manage bookings.</p>
        <div className="field">
          <input type="email" value={email} placeholder="you@email.com" autoComplete="email"
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()} />
        </div>
        <div className="field">
          <input type="password" value={password} placeholder="Password" autoComplete="current-password"
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()} />
        </div>
        {error && <div className="auth-err">{error}</div>}
        <button className="btn btn-primary" style={{ width: "100%" }}
          disabled={busy || !email || !password} onClick={submit}>
          {busy ? "Signing in…" : "Sign In"}
        </button>
        <div className="hint">
          <a href="/forgot" style={{ color: "var(--ember2)" }}>Forgot your password?</a>
        </div>
        <div className="hint" style={{ marginTop: 6 }}>
          No account? <a href="/signup" style={{ color: "var(--ember2)" }}>Create one</a>
          {" · "}
          <a href="/" style={{ color: "var(--ash)" }}>Back to site</a>
        </div>
      </div></div></div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
