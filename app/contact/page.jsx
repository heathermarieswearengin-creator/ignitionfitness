"use client";
import React, { useState, useEffect } from "react";
import { STUDIO } from "@/lib/config";
import { Theme } from "@/app/theme";

const INTEREST_OPTIONS = [
  { value: "", label: "Select an option..." },
  { value: "group", label: "Group Classes" },
  { value: "pt", label: "1:1 Personal Training" },
  { value: "membership", label: "Membership Info" },
  { value: "general", label: "General Question" },
];

// Icons
const MapPin = ({ s = 20 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);
const Mail = ({ s = 20 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);
const Clock = ({ s = 20 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);
const Phone = ({ s = 20 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);
const ArrowRight = ({ s = 16 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7"/>
  </svg>
);
const CheckCircle = ({ s = 48 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

const PHONE_NUMBER = "(909) 921-4463";
const PHONE_TEL = "tel:+19099214463";

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    interest: "",
    message: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Bot protection fields
  const [honeypot, setHoneypot] = useState("");
  const [timingToken, setTimingToken] = useState("");

  // Generate timing token on mount
  useEffect(() => {
    // Simple client-side timing token: base64 of load timestamp
    const timestamp = Date.now();
    const secretNum = 42; // Must match server-side calculation approach
    const obfuscated = timestamp ^ (secretNum * 100);
    setTimingToken(btoa(`${obfuscated}.${timestamp % 1000}`));
  }, []);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.email.trim()) {
      errs.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errs.email = "Please enter a valid email";
    }
    if (!form.message.trim()) errs.message = "Message is required";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || null,
          interest: form.interest || null,
          message: form.message.trim(),
          // Bot protection fields
          website: honeypot, // Honeypot field (should be empty)
          _t: timingToken,   // Timing token
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to send message");
      }

      setSubmitted(true);
      setForm({ name: "", email: "", phone: "", interest: "", message: "" });
    } catch (err) {
      setSubmitError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    if (errors[field]) setErrors((er) => ({ ...er, [field]: null }));
  };

  // Success state
  if (submitted) {
    return (
      <div className="ign">
        <Theme />
        <div className="wrap" style={{ padding: "60px 24px" }}>
          <div style={{ maxWidth: 540, margin: "0 auto", textAlign: "center" }}>
            <div style={{
              width: 100, height: 100, borderRadius: 24, margin: "0 auto 28px",
              display: "grid", placeItems: "center",
              background: "linear-gradient(150deg, var(--f800), var(--f700))",
              border: "1.5px solid var(--line)", color: "#22c55e"
            }}>
              <CheckCircle s={48} />
            </div>
            <h1 style={{
              fontFamily: "var(--display)", fontSize: 32, textTransform: "uppercase",
              color: "var(--bone)", marginBottom: 12
            }}>Message Sent</h1>
            <p style={{ color: "var(--ash)", fontSize: 16, lineHeight: 1.6, marginBottom: 32 }}>
              Thanks for reaching out. We'll get back to you within 24 hours.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <a href="/" className="btn btn-ghost">
                Back to Home
              </a>
              <button onClick={() => setSubmitted(false)} className="btn btn-ghost">
                Send Another
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ign">
      <Theme />
      <div className="wrap" style={{ padding: "48px 24px 80px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          {/* Header */}
          <div style={{ marginBottom: 40 }}>
            <div className="eyebrow" style={{ marginBottom: 20 }}>
              <span className="dot" />
              Get in Touch
            </div>
            <h1 className="sh" style={{ marginBottom: 12 }}>Contact Us</h1>
            <p style={{ color: "var(--ash)", fontSize: 16, lineHeight: 1.5, marginBottom: 20 }}>
              Have a question or ready to start? We're here to help.
            </p>
            {/* Quick contact buttons */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <a href={PHONE_TEL} className="btn btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
                <Phone s={18} />
                Call Us
              </a>
              <a href="mailto:mike@ignitionfitness.com" className="btn btn-ghost" style={{ display: "inline-flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
                <Mail s={18} />
                Email Us
              </a>
            </div>
          </div>

          {/* Two-column layout */}
          <style>{`
            @media (min-width: 700px) {
              .contact-grid { grid-template-columns: 1fr 340px !important; }
            }
          `}</style>
          <div className="contact-grid" style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: 32,
          }}>
            {/* Form */}
            <form onSubmit={handleSubmit} style={{
              background: "var(--f900)", border: "1.5px solid var(--line)", borderRadius: 20,
              padding: "28px 24px"
            }}>
              {submitError && (
                <div style={{
                  padding: "14px 16px", marginBottom: 20,
                  background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.3)",
                  borderRadius: 10, color: "#ef4444", fontSize: 14
                }}>
                  {submitError}
                  <button
                    type="button"
                    onClick={() => setSubmitError(null)}
                    style={{
                      marginLeft: 12, padding: "4px 10px",
                      background: "rgba(239,68,68,.15)", border: "none", borderRadius: 6,
                      color: "#ef4444", fontSize: 12, cursor: "pointer"
                    }}
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Honeypot field - hidden from users, bots will fill it */}
              <div style={{
                position: "absolute",
                left: "-9999px",
                opacity: 0,
                pointerEvents: "none",
                height: 0,
                overflow: "hidden",
              }} aria-hidden="true">
                <label htmlFor="website">Website</label>
                <input
                  type="text"
                  id="website"
                  name="website"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              <div className="field">
                <label>Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={handleChange("name")}
                  placeholder="Your name"
                  style={errors.name ? { borderColor: "#ef4444" } : {}}
                />
                {errors.name && <div style={{ marginTop: 6, fontSize: 12, color: "#ef4444" }}>{errors.name}</div>}
              </div>

              <div className="field">
                <label>Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={handleChange("email")}
                  placeholder="you@example.com"
                  style={errors.email ? { borderColor: "#ef4444" } : {}}
                />
                {errors.email && <div style={{ marginTop: 6, fontSize: 12, color: "#ef4444" }}>{errors.email}</div>}
              </div>

              <div className="field">
                <label>Phone <span style={{ color: "#6b5d52", fontWeight: 400 }}>(optional)</span></label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={handleChange("phone")}
                  placeholder="(555) 123-4567"
                />
              </div>

              <div className="field">
                <label>I'm interested in</label>
                <select
                  value={form.interest}
                  onChange={handleChange("interest")}
                  style={{
                    width: "100%",
                    background: "var(--f800)",
                    border: "1.5px solid var(--line)",
                    borderRadius: 11,
                    padding: "13px 15px",
                    color: "var(--bone)",
                    fontFamily: "var(--body)",
                    fontSize: 16,
                    outline: "none",
                    cursor: "pointer",
                    appearance: "none",
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23b0a193' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 14px center",
                    paddingRight: 44,
                    minHeight: 48,
                    transition: ".16s"
                  }}
                >
                  {INTEREST_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} style={{ background: "var(--f900)" }}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>Message *</label>
                <textarea
                  value={form.message}
                  onChange={handleChange("message")}
                  rows={5}
                  placeholder="How can we help you?"
                  style={{
                    width: "100%",
                    background: "var(--f800)",
                    border: `1.5px solid ${errors.message ? "#ef4444" : "var(--line)"}`,
                    borderRadius: 11,
                    padding: "13px 15px",
                    color: "var(--bone)",
                    fontFamily: "var(--body)",
                    fontSize: 16,
                    outline: "none",
                    resize: "vertical",
                    minHeight: 120,
                    transition: ".16s"
                  }}
                />
                {errors.message && <div style={{ marginTop: 6, fontSize: 12, color: "#ef4444" }}>{errors.message}</div>}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary"
                style={{ width: "100%", marginTop: 8 }}
              >
                {submitting ? "Sending..." : "Send Message"}
              </button>
            </form>

            {/* Studio Info Panel */}
            <div>
              <div style={{
                background: "var(--f800)", border: "1.5px solid var(--line)", borderRadius: 20,
                padding: "28px 24px"
              }}>
                <h2 style={{
                  fontFamily: "var(--mono)", fontSize: 11, fontWeight: 700,
                  letterSpacing: ".12em", textTransform: "uppercase", color: "var(--gold)",
                  marginBottom: 24
                }}>Studio Info</h2>

                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {/* Phone */}
                  <div style={{ display: "flex", gap: 14 }}>
                    <div style={{
                      width: 40, height: 40, minWidth: 40, borderRadius: 10,
                      display: "grid", placeItems: "center",
                      background: "rgba(224,45,36,.1)", color: "var(--flame)"
                    }}>
                      <Phone s={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--bone)", marginBottom: 3 }}>
                        Phone
                      </div>
                      <a
                        href={PHONE_TEL}
                        style={{ fontSize: 13, color: "var(--gold)", textDecoration: "none" }}
                      >
                        {PHONE_NUMBER}
                      </a>
                    </div>
                  </div>

                  {/* Email */}
                  <div style={{ display: "flex", gap: 14 }}>
                    <div style={{
                      width: 40, height: 40, minWidth: 40, borderRadius: 10,
                      display: "grid", placeItems: "center",
                      background: "rgba(224,45,36,.1)", color: "var(--flame)"
                    }}>
                      <Mail s={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--bone)", marginBottom: 3 }}>
                        Email
                      </div>
                      <a
                        href="mailto:mike@ignitionfitness.com"
                        style={{ fontSize: 13, color: "var(--gold)", textDecoration: "none" }}
                      >
                        mike@ignitionfitness.com
                      </a>
                    </div>
                  </div>

                  {/* Address */}
                  <div style={{ display: "flex", gap: 14 }}>
                    <div style={{
                      width: 40, height: 40, minWidth: 40, borderRadius: 10,
                      display: "grid", placeItems: "center",
                      background: "rgba(224,45,36,.1)", color: "var(--flame)"
                    }}>
                      <MapPin s={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--bone)", marginBottom: 3 }}>
                        Location
                      </div>
                      <div style={{ fontSize: 13, color: "var(--ash)", lineHeight: 1.5 }}>
                        {STUDIO.addressLine}<br />
                        Rancho Cucamonga, CA 91730
                      </div>
                    </div>
                  </div>

                  {/* Hours */}
                  <div style={{ display: "flex", gap: 14 }}>
                    <div style={{
                      width: 40, height: 40, minWidth: 40, borderRadius: 10,
                      display: "grid", placeItems: "center",
                      background: "rgba(224,45,36,.1)", color: "var(--flame)"
                    }}>
                      <Clock s={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--bone)", marginBottom: 3 }}>
                        Hours
                      </div>
                      <div style={{ fontSize: 13, color: "var(--ash)", lineHeight: 1.5 }}>
                        Mon–Fri: 6am–8pm<br />
                        Sat: 8am–12pm<br />
                        Sun: Closed
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Prefer to call CTA */}
              <div style={{
                marginTop: 16,
                background: "linear-gradient(150deg, rgba(224,45,36,.08), var(--f900))",
                border: "1.5px solid var(--ember)",
                borderRadius: 16,
                padding: "20px 22px",
                textAlign: "center"
              }}>
                <div style={{
                  fontSize: 15, fontWeight: 600, color: "var(--bone)", marginBottom: 6
                }}>
                  Prefer to call or text?
                </div>
                <p style={{ fontSize: 13, color: "var(--ash)", marginBottom: 14, lineHeight: 1.5 }}>
                  We're happy to chat. Give us a call or shoot us a text.
                </p>
                <a
                  href={PHONE_TEL}
                  className="btn btn-primary"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    textDecoration: "none"
                  }}
                >
                  <Phone s={16} />
                  <span>{PHONE_NUMBER}</span>
                </a>
              </div>

              {/* Book CTA */}
              <div style={{
                marginTop: 16,
                background: "var(--f900)", border: "1.5px solid var(--line)", borderRadius: 16,
                padding: "20px 22px"
              }}>
                <div style={{
                  fontSize: 15, fontWeight: 600, color: "var(--bone)", marginBottom: 6
                }}>
                  Ready to book?
                </div>
                <p style={{ fontSize: 13, color: "var(--ash)", marginBottom: 14, lineHeight: 1.5 }}>
                  Skip the form and book your session directly.
                </p>
                <a
                  href="/#book"
                  className="btn btn-ghost"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    textDecoration: "none"
                  }}
                >
                  <span>Book a Session</span>
                  <ArrowRight s={14} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
