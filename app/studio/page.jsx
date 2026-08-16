"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { Theme } from "@/app/theme";
import { PageHeader } from "@/app/components/PageHeader";
import { Nav } from "@/app/components/Nav";

function Logo({ h = 44 }) {
  return <img src="/images/logo.png" alt="Ignition Fitness" style={{ height: h, width: "auto", display: "block" }} />;
}

export default function StudioPage() {
  const router = useRouter();

  return (
    <div className="ign">
      <Theme />
      <Nav activePage="studio" />

      {/* Page Header */}
      <PageHeader
        badge="Take a Look Inside"
        title="The Studio"
        subtitle="9,000 sq ft of dedicated kettlebell training space in Rancho Cucamonga."
      />

      {/* Gallery */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          {/* Top row - exterior shots */}
          <div className="studio-grid-top">
            <div className="studio-img studio-img-lg">
              <img src="/images/exterior-storefront.JPG" alt="Ignition Fitness building exterior with turf lawn" loading="lazy" width={800} height={533} />
            </div>
            <div className="studio-img studio-img-sm">
              <img src="/images/signage-closeup.JPG" alt="Ignition Fitness storefront signage" loading="lazy" width={600} height={400} />
            </div>
          </div>

          {/* Interior grid */}
          <div className="studio-grid-main">
            <div className="studio-img studio-img-wide">
              <img src="/images/training-floor.JPG" alt="Open training floor with kettlebell wall and rig" loading="lazy" width={800} height={533} />
            </div>
            <div className="studio-img studio-img-med">
              <img src="/images/entrance-hallway.JPG" alt="Glass entry hallway leading to gym floor" loading="lazy" width={600} height={400} />
            </div>
            <div className="studio-img studio-img-med">
              <img src="/images/strength-machines.JPG" alt="Secondary equipment room with machines" loading="lazy" width={600} height={400} />
            </div>
          </div>

          {/* CTA with detail image */}
          <div className="studio-cta-row">
            <div className="studio-img studio-img-detail">
              <img src="/images/kettlebell-detail.JPG" alt="Kettlebell close-up with Ignition logo" loading="lazy" width={400} height={400} />
            </div>
            <div className="band">
              <div className="hero-glow2" />
              <h2>Come See It For Yourself</h2>
              <p>Your first class is just $25. No commitment, no contracts.</p>
              <button className="btn btn-ghost" onClick={() => router.push("/")}>Book Your First Class</button>
              <p style={{ marginTop: 16, fontSize: 14, color: "var(--ash)" }}>
                Have questions first? <a href="/contact" style={{ color: "var(--ember2)", textDecoration: "underline", textUnderlineOffset: 2 }}>Contact us</a>
              </p>
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
              <a href="/contact">Contact</a>
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
