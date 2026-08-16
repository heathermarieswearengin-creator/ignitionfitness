"use client";
import React, { useState } from "react";
import { STUDIO } from "@/lib/config";

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
      <div style={{ minHeight: "100vh", background: "#0c0807", padding: "60px 16px" }}>
        <div style={{ maxWidth: 540, margin: "0 auto", textAlign: "center" }}>
          <div style={{
            width: 100, height: 100, borderRadius: 24, margin: "0 auto 28px",
            display: "grid", placeItems: "center",
            background: "linear-gradient(150deg, #1d1411, #281a15)",
            border: "1.5px solid #3a261d", color: "#22c55e"
          }}>
            <CheckCircle s={48} />
          </div>
          <h1 style={{
            fontFamily: "var(--display)", fontSize: 32, textTransform: "uppercase",
            color: "#f3ece1", marginBottom: 12
          }}>Message Sent</h1>
          <p style={{ color: "#b0a193", fontSize: 16, lineHeight: 1.6, marginBottom: 32 }}>
            Thanks for reaching out. We'll get back to you within 24 hours.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a
              href="/"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "14px 24px", background: "#1d1411", border: "1.5px solid #3a261d",
                borderRadius: 12, color: "#f3ece1", textDecoration: "none",
                fontFamily: "var(--mono)", fontSize: 13, fontWeight: 600,
                textTransform: "uppercase", letterSpacing: ".04em"
              }}
            >
              Back to Home
            </a>
            <button
              onClick={() => setSubmitted(false)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "14px 24px", background: "transparent", border: "1.5px solid #3a261d",
                borderRadius: 12, color: "#b0a193", cursor: "pointer",
                fontFamily: "var(--mono)", fontSize: 13, fontWeight: 600,
                textTransform: "uppercase", letterSpacing: ".04em"
              }}
            >
              Send Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  const inputStyle = (hasError) => ({
    width: "100%", padding: "14px 16px",
    background: "#140d0b", border: `1.5px solid ${hasError ? "#ef4444" : "#3a261d"}`,
    borderRadius: 10, color: "#f3ece1", fontSize: 15,
    fontFamily: "inherit", outline: "none",
    transition: "border-color .15s"
  });

  const labelStyle = {
    display: "block", marginBottom: 8,
    fontFamily: "var(--mono)", fontSize: 11, fontWeight: 600,
    letterSpacing: ".08em", textTransform: "uppercase", color: "#b0a193"
  };

  const errorStyle = {
    marginTop: 6, fontSize: 12, color: "#ef4444"
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0c0807", padding: "48px 16px 80px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{
            fontFamily: "var(--mono)", fontSize: 11, fontWeight: 700,
            letterSpacing: ".18em", color: "#e02d24", textTransform: "uppercase",
            marginBottom: 8
          }}>Get in Touch</div>
          <h1 style={{
            fontFamily: "var(--display)", fontSize: "clamp(32px, 6vw, 44px)",
            textTransform: "uppercase", color: "#f3ece1", marginBottom: 10, lineHeight: 1.1
          }}>Contact Us</h1>
          <p style={{ color: "#b0a193", fontSize: 16, lineHeight: 1.5 }}>
            We'll get back to you within 24 hours.
          </p>
        </div>

        {/* Two-column layout */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: 32,
        }}>
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
              background: "#140d0b", border: "1.5px solid #3a261d", borderRadius: 20,
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

              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={handleChange("name")}
                  style={inputStyle(errors.name)}
                  placeholder="Your name"
                />
                {errors.name && <div style={errorStyle}>{errors.name}</div>}
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={handleChange("email")}
                  style={inputStyle(errors.email)}
                  placeholder="you@example.com"
                />
                {errors.email && <div style={errorStyle}>{errors.email}</div>}
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Phone <span style={{ color: "#6b5d52", fontWeight: 400 }}>(optional)</span></label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={handleChange("phone")}
                  style={inputStyle(false)}
                  placeholder="(555) 123-4567"
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>I'm interested in</label>
                <select
                  value={form.interest}
                  onChange={handleChange("interest")}
                  style={{
                    ...inputStyle(false),
                    cursor: "pointer",
                    appearance: "none",
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23b0a193' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 14px center",
                    paddingRight: 44
                  }}
                >
                  {INTEREST_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} style={{ background: "#140d0b" }}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>Message *</label>
                <textarea
                  value={form.message}
                  onChange={handleChange("message")}
                  rows={5}
                  style={{
                    ...inputStyle(errors.message),
                    resize: "vertical", minHeight: 120
                  }}
                  placeholder="How can we help you?"
                />
                {errors.message && <div style={errorStyle}>{errors.message}</div>}
              </div>

              <button
                type="submit"
                disabled={submitting}
                style={{
                  width: "100%", padding: "16px 24px",
                  background: submitting ? "#6b5d52" : "linear-gradient(135deg, #e02d24, #c9251c)",
                  border: "none", borderRadius: 12, color: "#f3ece1",
                  fontFamily: "var(--display)", fontSize: 15, fontWeight: 700,
                  textTransform: "uppercase", letterSpacing: ".04em",
                  cursor: submitting ? "not-allowed" : "pointer",
                  opacity: submitting ? 0.7 : 1,
                  transition: "opacity .15s"
                }}
              >
                {submitting ? "Sending..." : "Send Message"}
              </button>
            </form>

            {/* Studio Info Panel */}
            <div>
              <div style={{
                background: "#1d1411", border: "1.5px solid #3a261d", borderRadius: 20,
                padding: "28px 24px"
              }}>
                <h2 style={{
                  fontFamily: "var(--mono)", fontSize: 11, fontWeight: 700,
                  letterSpacing: ".12em", textTransform: "uppercase", color: "#f0ab33",
                  marginBottom: 24
                }}>Studio Info</h2>

                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {/* Address */}
                  <div style={{ display: "flex", gap: 14 }}>
                    <div style={{
                      width: 40, height: 40, minWidth: 40, borderRadius: 10,
                      display: "grid", placeItems: "center",
                      background: "rgba(224,45,36,.1)", color: "#e02d24"
                    }}>
                      <MapPin s={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#f3ece1", marginBottom: 3 }}>
                        Location
                      </div>
                      <div style={{ fontSize: 13, color: "#b0a193", lineHeight: 1.5 }}>
                        {STUDIO.addressLine}<br />
                        Rancho Cucamonga, CA 91730
                      </div>
                    </div>
                  </div>

                  {/* Email */}
                  <div style={{ display: "flex", gap: 14 }}>
                    <div style={{
                      width: 40, height: 40, minWidth: 40, borderRadius: 10,
                      display: "grid", placeItems: "center",
                      background: "rgba(224,45,36,.1)", color: "#e02d24"
                    }}>
                      <Mail s={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#f3ece1", marginBottom: 3 }}>
                        Email
                      </div>
                      <a
                        href="mailto:mike@ignitionfitness.com"
                        style={{ fontSize: 13, color: "#f0ab33", textDecoration: "none" }}
                      >
                        mike@ignitionfitness.com
                      </a>
                    </div>
                  </div>

                  {/* Hours */}
                  <div style={{ display: "flex", gap: 14 }}>
                    <div style={{
                      width: 40, height: 40, minWidth: 40, borderRadius: 10,
                      display: "grid", placeItems: "center",
                      background: "rgba(224,45,36,.1)", color: "#e02d24"
                    }}>
                      <Clock s={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#f3ece1", marginBottom: 3 }}>
                        Hours
                      </div>
                      <div style={{ fontSize: 13, color: "#b0a193", lineHeight: 1.5 }}>
                        Mon–Fri: 6am–8pm<br />
                        Sat: 8am–12pm<br />
                        Sun: Closed
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Book CTA */}
              <div style={{
                marginTop: 16,
                background: "#140d0b", border: "1.5px solid #3a261d", borderRadius: 16,
                padding: "20px 22px"
              }}>
                <div style={{
                  fontSize: 15, fontWeight: 600, color: "#f3ece1", marginBottom: 6
                }}>
                  Ready to book?
                </div>
                <p style={{ fontSize: 13, color: "#b0a193", marginBottom: 14, lineHeight: 1.5 }}>
                  Skip the form and book your session directly.
                </p>
                <a
                  href="/#book"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    padding: "12px 18px",
                    background: "linear-gradient(135deg, #e02d24, #c9251c)",
                    border: "none", borderRadius: 10, color: "#f3ece1",
                    fontFamily: "var(--mono)", fontSize: 12, fontWeight: 600,
                    textTransform: "uppercase", letterSpacing: ".04em",
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
