"use client";
import React from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Theme } from "@/app/theme";
import { PageHeader } from "@/app/components/PageHeader";

function Logo({ h = 44 }) {
  return <img src="/images/logo.png" alt="Ignition Fitness" style={{ height: h, width: "auto", display: "block" }} />;
}

export default function StudioPage() {
  const { data: session } = useSession();
  const user = session?.user ?? null;
  const router = useRouter();

  return (
    <div className="ign">
      <Theme />

      {/* Nav */}
      <nav className="nav">
        <div className="wrap nav-in">
          <button className="logo" onClick={() => router.push("/")}>
            <Logo h={52} />
          </button>
          <div className="nav-links">
            <button className="nlink" onClick={() => router.push("/")}>HOME</button>
            <button className="nlink" onClick={() => router.push("/our-story")}>OUR STORY</button>
            <button className="nlink on">THE STUDIO</button>
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
        badge="Take a Look Inside"
        title="The Studio"
        subtitle="9,000 sq ft of dedicated kettlebell training space in Rancho Cucamonga."
      />

      {/* Gallery - using explicit inline styles to ensure sizing works */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          {/* Top row - exterior shots */}
          <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 14, marginBottom: 14 }}>
            <div style={{ height: 380, borderRadius: 14, overflow: "hidden" }}>
              <img src="/images/exterior-storefront.JPG" alt="Ignition Fitness building exterior with turf lawn" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </div>
            <div style={{ height: 380, borderRadius: 14, overflow: "hidden" }}>
              <img src="/images/signage-closeup.JPG" alt="Ignition Fitness storefront signage" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </div>
          </div>

          {/* Interior grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", gap: 14, marginBottom: 40 }}>
            <div style={{ height: 280, borderRadius: 14, overflow: "hidden" }}>
              <img src="/images/training-floor.JPG" alt="Open training floor with kettlebell wall and rig" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </div>
            <div style={{ height: 280, borderRadius: 14, overflow: "hidden" }}>
              <img src="/images/entrance-hallway.JPG" alt="Glass entry hallway leading to gym floor" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </div>
            <div style={{ height: 280, borderRadius: 14, overflow: "hidden" }}>
              <img src="/images/strength-machines.JPG" alt="Secondary equipment room with machines" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </div>
          </div>

          {/* CTA with detail image */}
          <div style={{ display: "flex", gap: 20, alignItems: "stretch" }}>
            <div style={{ width: 260, height: 220, borderRadius: 14, overflow: "hidden", flexShrink: 0 }}>
              <img src="/images/kettlebell-detail.JPG" alt="Kettlebell close-up with Ignition logo" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </div>
            <div className="band">
              <div className="hero-glow2" />
              <h2>Come See It For Yourself</h2>
              <p>Your first class is just $25. No commitment, no contracts.</p>
              <button className="btn btn-ghost" onClick={() => router.push("/")}>Book Your First Class</button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
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
