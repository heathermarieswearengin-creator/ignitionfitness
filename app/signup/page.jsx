"use client";
import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Theme } from "@/app/theme";

const Bell = ({ s = 26 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path d="M9 6a3 3 0 1 1 6 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M12 8c-3.5 0-6 2.8-6 6.5C6 18 8.7 21 12 21s6-3 6-6.5C18 10.8 15.5 8 12 8z" stroke="currentColor" strokeWidth="2" />
  </svg>
);

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const valid =
    form.name.trim() && /\S+@\S+\.\S+/.test(form.email) && form.password.length >= 8;

  const submit = async () => {
    if (busy || !valid) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Could not create that account.");

      // Straight into a session so they can book immediately.
      const signedIn = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });
      if (signedIn?.error) {
        router.push("/login");
        return;
      }
      router.push("/");
      router.refresh();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="ign">
      <Theme />
      <div className="adm"><div className="wrap"><div className="gate">
        <div className="glock"><Bell /></div>
        <h2>Create Account</h2>
        <p>Book multiple sessions at once and keep track of your training.</p>
        <div className="field">
          <input value={form.name} placeholder="Full name" autoComplete="name" onChange={set("name")} />
        </div>
        <div className="field">
          <input type="email" value={form.email} placeholder="you@email.com" autoComplete="email" onChange={set("email")} />
        </div>
        <div className="field">
          <input value={form.phone} placeholder="Phone (optional)" autoComplete="tel" onChange={set("phone")} />
        </div>
        <div className="field">
          <input type="password" value={form.password} placeholder="Password (8+ characters)"
            autoComplete="new-password" onChange={set("password")}
            onKeyDown={(e) => e.key === "Enter" && submit()} />
        </div>
        {error && <div className="auth-err">{error}</div>}
        <button className="btn btn-primary" style={{ width: "100%" }} disabled={busy || !valid} onClick={submit}>
          {busy ? "Creating…" : "Create Account"}
        </button>
        <div className="hint">
          Already a member? <a href="/login" style={{ color: "var(--ember2)" }}>Sign in</a>
          {" · "}
          <a href="/" style={{ color: "var(--ash)" }}>Back to site</a>
        </div>
      </div></div></div>
    </div>
  );
}
