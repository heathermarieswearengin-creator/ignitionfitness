"use client";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Theme } from "@/app/theme";
import { studioNow, STUDIO } from "@/lib/config";
import { googleCalendarUrl } from "@/lib/ics";

/**
 * /sessions - Member's "My Sessions" page
 * This is the landing page for logged-in members when accessing the PWA.
 */

const LOGO_URL = "data:image/png;base64,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";

function Logo({ h = 44 }) {
  if (LOGO_URL && !LOGO_URL.includes("__")) return <img src={LOGO_URL} alt="Ignition Fitness" style={{ height: h, width: "auto", display: "block" }} />;
  return <span className="logo-word">IGNITION <b>FITNESS</b></span>;
}

const Flame = ({ s = 18 }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 2c1 3 4 4.5 4 8a4 4 0 0 1-8 0c0-1 .5-2 1-2.5C9 9 9 11 11 11c1.5 0 2-1.5 1-4 .5.5 0 0 0-5z" fill="currentColor"/><path d="M12 22a6 6 0 0 0 6-6c0-2-1-4-2.5-5.5C16 13 14.5 14 13 14c-2.5 0-3-2.5-2-5C8 11 6 13 6 16a6 6 0 0 0 6 6z" fill="currentColor"/></svg>);
const Arrow = ({ s = 16 }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>);
const CalendarIcon = ({ s = 16 }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="17" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M3 9h18M8 3v3M16 3v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>);

export default function SessionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const user = session?.user ?? null;
  const isAdmin = user?.role === "ADMIN";

  const [data, setData] = useState({ upcoming: [], past: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?next=/sessions");
    }
  }, [status, router]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const res = await fetch("/api/me/bookings");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch {}
      setLoading(false);
    };
    load();
  }, [user]);

  // Show loading while checking auth
  if (status === "loading" || !user) {
    return (
      <div className="ign">
        <Theme />
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--f1000)" }}>
          <div style={{ textAlign: "center" }}>
            <Logo h={48} />
            <div style={{ marginTop: 24, color: "var(--ash)" }}>Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  const handleSignOut = () => signOut({ callbackUrl: "/" });

  return (
    <div className="ign">
      <Theme />

      {/* Header */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(12,9,8,.95)", backdropFilter: "blur(14px)",
        borderBottom: "1px solid #3a261d",
        padding: "0 20px"
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          height: 64, maxWidth: 720, margin: "0 auto"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Logo h={38} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {isAdmin && (
              <a href="/admin" style={{
                padding: "8px 14px",
                background: "#1d1411",
                border: "1px solid #3a261d",
                borderRadius: 8,
                color: "var(--gold)",
                fontSize: 13,
                fontWeight: 600,
                textDecoration: "none"
              }}>
                Admin
              </a>
            )}
            <button onClick={handleSignOut} style={{
              padding: "8px 14px",
              background: "transparent",
              border: "1px solid #3a261d",
              borderRadius: 8,
              color: "var(--ash)",
              fontSize: 13,
              cursor: "pointer"
            }}>
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main style={{ maxWidth: 720, margin: "0 auto", padding: "24px 20px" }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{
            fontFamily: "var(--display)",
            fontSize: 28,
            color: "var(--bone)",
            marginBottom: 6
          }}>
            My Sessions
          </h1>
          <p style={{ color: "var(--ash)", fontSize: 14 }}>
            Welcome back, {user.name?.split(" ")[0] || "there"}
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 48, color: "var(--ash)" }}>
            Loading your sessions...
          </div>
        ) : (
          <>
            {/* Upcoming */}
            <section style={{ marginBottom: 32 }}>
              <h2 style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: ".1em",
                textTransform: "uppercase",
                color: "var(--gold)",
                marginBottom: 12
              }}>
                Upcoming
              </h2>

              {data.upcoming.length === 0 ? (
                <div style={{
                  padding: 32,
                  background: "var(--f800)",
                  border: "1px solid var(--line)",
                  borderRadius: 14,
                  textAlign: "center"
                }}>
                  <div style={{ marginBottom: 12 }}>
                    <CalendarIcon s={32} />
                  </div>
                  <p style={{ color: "var(--ash)", marginBottom: 16 }}>No upcoming sessions</p>
                  <a href="/#book" className="btn btn-primary" style={{ textDecoration: "none" }}>
                    Book a Session
                  </a>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {data.upcoming.map(b => (
                    <div key={b.id} style={{
                      padding: 16,
                      background: "var(--f800)",
                      border: b.isStanding ? "1px solid rgba(168,85,247,.3)" : "1px solid var(--line)",
                      borderRadius: 12,
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                        <div>
                          {/* Recurring tag for standing sessions */}
                          {b.isStanding && (
                            <div style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              padding: "3px 8px",
                              background: "rgba(168,85,247,.15)",
                              borderRadius: 4,
                              fontSize: 10,
                              fontWeight: 600,
                              color: "#a855f7",
                              letterSpacing: ".03em",
                              marginBottom: 6,
                            }}>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M3 12a9 9 0 1 0 9-9M3 12V3m0 9h9" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              RECURRING
                            </div>
                          )}
                          <div style={{ fontWeight: 600, color: "var(--bone)" }}>
                            {b.classType === "pt" ? "1:1 Personal Training" : "Group Class"}
                          </div>
                          <div style={{ fontSize: 13, color: "var(--ash)" }}>
                            {new Date(`${b.date}T00:00:00.000Z`).toLocaleDateString("en-US", { timeZone: "UTC", weekday: "short", month: "short", day: "numeric" })} at {b.time}
                          </div>
                        </div>
                        {b.isStanding ? (
                          <span style={{
                            padding: "4px 10px",
                            background: "rgba(34, 197, 94, .15)",
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 600,
                            color: "#22c55e"
                          }}>
                            Confirmed
                          </span>
                        ) : (
                          <span style={{
                            padding: "4px 10px",
                            background: "rgba(34, 197, 94, .15)",
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 600,
                            color: "#22c55e"
                          }}>
                            {b.ref}
                          </span>
                        )}
                      </div>

                      {/* Actions row - only for regular bookings */}
                      {!b.isStanding && b.manageToken && (
                        <a
                          href={`/manage-booking/${b.manageToken}`}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            fontSize: 13,
                            color: "var(--gold)",
                            textDecoration: "none"
                          }}
                        >
                          Manage booking <Arrow s={12} />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Book more */}
            <a
              href="/#book"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                padding: 16,
                background: "linear-gradient(150deg, var(--ember), var(--flame))",
                borderRadius: 12,
                color: "white",
                fontWeight: 600,
                textDecoration: "none",
                marginBottom: 32
              }}
            >
              <Flame s={20} />
              Book Another Session
            </a>

            {/* Past sessions */}
            {data.past.length > 0 && (
              <section>
                <h2 style={{
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: ".1em",
                  textTransform: "uppercase",
                  color: "var(--ash)",
                  marginBottom: 12
                }}>
                  Past Sessions
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {data.past.slice(0, 5).map(b => (
                    <div key={b.id} style={{
                      padding: 14,
                      background: "var(--f900)",
                      border: "1px solid var(--line)",
                      borderRadius: 10,
                      opacity: 0.7
                    }}>
                      <div style={{ fontWeight: 500, color: "var(--bone)", fontSize: 14 }}>
                        {b.classType === "pt" ? "1:1 PT" : "Group"}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--ash)" }}>
                        {new Date(`${b.date}T00:00:00.000Z`).toLocaleDateString("en-US", { timeZone: "UTC", month: "short", day: "numeric" })} · {b.time}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
