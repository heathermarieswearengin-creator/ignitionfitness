"use client";
import React from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Theme } from "@/app/theme";
import { PageHeader } from "@/app/components/PageHeader";

// Logo - use the actual file from public/images
function Logo({ h = 44 }) {
  return <img src="/images/logo.png" alt="Ignition Fitness" style={{ height: h, width: "auto", display: "block" }} />;
}

const Bell = ({ s = 22 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path d="M9 6a3 3 0 1 1 6 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M12 8c-3.5 0-6 2.8-6 6.5C6 18 8.7 21 12 21s6-3 6-6.5C18 10.8 15.5 8 12 8z" stroke="currentColor" strokeWidth="2" />
  </svg>
);

export default function OurStoryPage() {
  const { data: session } = useSession();
  const user = session?.user ?? null;
  const router = useRouter();

  return (
    <div className="ign">
      <Theme />

      {/* Nav - matching homepage exactly */}
      <nav className="nav">
        <div className="wrap nav-in">
          <button className="logo" onClick={() => router.push("/")}>
            <Logo h={52} />
          </button>
          <div className="nav-links">
            <button className="nlink" onClick={() => router.push("/")}>HOME</button>
            <button className="nlink on">OUR STORY</button>
            <button className="nlink" onClick={() => router.push("/studio")}>THE STUDIO</button>
            <button className="nlink" onClick={() => router.push("/#pricing")}>PRICING</button>
            {user ? (
              <>
                <button className="nlink" onClick={() => router.push("/sessions")}>MY SESSIONS</button>
                <button className="nlink" onClick={() => signOut({ callbackUrl: "/" })}>SIGN OUT</button>
              </>
            ) : (
              <a className="nlink" href="/login">SIGN IN</a>
            )}
            <button className="btn btn-primary" onClick={() => router.push("/")} style={{ marginLeft: 8 }}>Book a Class</button>
          </div>
        </div>
      </nav>

      {/* Page Header */}
      <PageHeader
        badge="Est. 2008"
        title="Our Story"
        subtitle="From a single bell to a community of lifters."
      />

      {/* Coach Section - same layout as homepage coaching feature */}
      <section className="section">
        <div className="wrap">
          <div className="coaching-feature">
            <div className="coaching-img">
              <img
                src="/images/mike-overhead-1.JPG"
                alt="Coach Mike performing a kettlebell overhead press at Ignition Fitness"
                loading="lazy"
              />
            </div>
            <div className="coaching-text">
              <div className="kicker">Meet Your Coach</div>
              <h3>Mike Williams</h3>
              <p><span className="highlight">RKC-certified since 2008.</span> 15+ years of kettlebell coaching. One mission: help you get stronger than you thought possible.</p>
              <p>Mike discovered kettlebells when they were still considered "unconventional" in most gyms. After earning his RKC certification — one of the most rigorous kettlebell certifications in the world — he knew he'd found his calling.</p>
              <blockquote className="story-quote">
                "There's something honest about a kettlebell. It doesn't lie. It doesn't have settings or screens. It's just you, the bell, and gravity. That simplicity is what makes it powerful."
              </blockquote>
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy Section - using homepage's prop pattern */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="kicker">Our Philosophy</div>
          <h2 className="sh">Strength Without<br />The Confusion</h2>
          <p className="sh-sub">Simple tools. Expert guidance. Real results.</p>

          {/* Using the exact same props pattern from homepage */}
          <div className="props" style={{ marginTop: 42 }}>
            {[
              ["One Tool", "The kettlebell is the Swiss Army knife of fitness. Strength, cardio, mobility, power — all in one cast-iron handle."],
              ["Small Groups", "Ten people max. Every class feels personal. You're not a number — you're an athlete with a name and goals."],
              ["Real Coaching", "Every rep, every set. We don't just count reps — we coach movement. Proper form from day one."],
              ["No Machines", "No screens, no confusion, no waiting for equipment. Just you, the bell, and the work."],
              ["All Levels", "Whether it's your first swing or your thousandth snatch, we meet you where you are."],
              ["Results That Last", "Build strength you can use. Functional fitness that translates to real life."],
            ].map(([title, desc]) => (
              <div className="prop" key={title}>
                <span className="ic"><Bell s={20} /></span>
                <div>
                  <strong style={{ display: "block", marginBottom: 4, color: "var(--bone)" }}>{title}</strong>
                  <p style={{ margin: 0 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Band - exactly matching homepage */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="band">
            <div className="hero-glow2" />
            <h2>Ready To Ignite?</h2>
            <p>Your first class is just $25. No commitment, no contracts. Just show up.</p>
            <button className="btn btn-ghost" onClick={() => router.push("/")}>Book Your First Class</button>
          </div>
        </div>
      </section>

      {/* Footer - matching homepage */}
      <footer className="foot">
        <div className="wrap">
          <div className="foot-grid">
            <div>
              <button className="logo" onClick={() => router.push("/")} style={{ marginBottom: 16 }}>
                <Logo h={44} />
              </button>
              <p style={{ maxWidth: "34ch" }}>Forging strength, one swing at a time. Small-group kettlebell training in Rancho Cucamonga.</p>
            </div>
            <div>
              <h5>Navigate</h5>
              <a href="/">Home</a>
              <a href="/our-story">Our Story</a>
              <a href="/studio">The Studio</a>
              <a href="/#pricing">Pricing</a>
            </div>
            <div>
              <h5>Contact</h5>
              <a href="mailto:mike@ignitionfitness.com">mike@ignitionfitness.com</a>
              <a href="tel:9099214463">(909) 921-4463</a>
              <p>9125 Archibald Ave, Ste D<br />Rancho Cucamonga, CA 91730</p>
            </div>
          </div>
          <div className="foot-bottom">
            <span>© {new Date().getFullYear()} Ignition Fitness. All rights reserved.</span>
            <span>Rancho Cucamonga, CA</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
